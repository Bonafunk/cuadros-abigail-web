import { createClient } from "@supabase/supabase-js";

type Product = {
  item_id: string;
  title: string;
  price: number;
  currency_id: string;
  permalink: string;
  thumbnail: string | null;
  category_id: string | null;
};

async function getProducts(): Promise<Product[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase.from("catalog_products")
    .select("item_id,title,price,currency_id,permalink,thumbnail,category_id")
    .eq("is_active", true).eq("is_hidden", false)
    .order("updated_at", { ascending: false }).limit(120);
  return (data ?? []) as Product[];
}

const money = (value: number, currency: string) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: currency || "MXN" }).format(value);

export default async function Home() {
  const products = await getProducts();
  return (
    <main>
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <a href="/" className="text-2xl font-bold tracking-tight">CUADROS ABIGAIL</a>
        <nav className="hidden gap-6 text-sm md:flex"><a href="#catalogo">Catálogo</a><a href="#mayoreo">Mayoreo y proyectos</a><a href="#contacto">Contacto</a></nav>
        <a className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white" href="https://wa.me/525515911166">Cotizar por WhatsApp</a>
      </header>
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[.2em] text-amber-800">Fabricantes desde 2011 · Envíos a todo México</p>
          <h1 className="max-w-2xl text-5xl font-semibold leading-tight md:text-6xl">Decora tus espacios con arte.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-stone-600">Fabricamos cuadros decorativos impresos en alta resolución, laminados y montados sobre bastidores de madera. Venta al menudeo y mayoreo.</p>
          <a href="#catalogo" className="mt-8 inline-block rounded-full bg-stone-900 px-7 py-4 font-semibold text-white">Explorar catálogo</a>
        </div>
        <div className="rounded-3xl bg-stone-200 p-8 text-center">
          <div className="text-7xl">🖼️</div>
          <p className="mt-4 text-lg font-semibold">Cuadros Abigail</p>
          <p className="mt-2 text-sm text-stone-600">Fabricación propia para hogares y proyectos comerciales.</p>
        </div>
      </section>
      <section id="catalogo" className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm font-semibold uppercase tracking-widest text-amber-800">Nuestra selección</p><h2 className="mt-2 text-3xl font-semibold">Catálogo de cuadros</h2></div>
          <p className="text-sm text-stone-500">Precios y publicaciones sincronizados desde Mercado Libre</p>
        </div>
        {products.length === 0 ? <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center"><h3 className="text-xl font-semibold">Estamos preparando nuestro catálogo</h3><p className="mt-2 text-stone-600">Próximamente encontrarás aquí nuestras publicaciones de Mercado Libre.</p></div> :
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((p) => <article key={p.item_id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {p.thumbnail ? <img src={p.thumbnail.replace(/^http:/, "https:")} alt={p.title} className="aspect-square w-full object-contain bg-white" /> : <div className="aspect-square bg-stone-100" />}
            <div className="p-4"><h3 className="line-clamp-2 min-h-12 font-medium">{p.title}</h3><p className="mt-3 text-xl font-bold">{money(p.price, p.currency_id)}</p><a href={p.permalink} target="_blank" rel="noreferrer" className="mt-4 block rounded-full bg-amber-700 px-4 py-3 text-center text-sm font-semibold text-white">Comprar en Mercado Libre</a></div>
          </article>)}</div>}
      </section>
      <section id="mayoreo" className="bg-stone-900 px-6 py-16 text-white"><div className="mx-auto max-w-7xl"><p className="text-sm font-semibold uppercase tracking-widest text-amber-300">Proyectos comerciales</p><h2 className="mt-3 max-w-3xl text-3xl font-semibold">Soluciones decorativas para hoteles, Airbnb, restaurantes y oficinas.</h2><p className="mt-4 max-w-2xl leading-7 text-stone-300">Atendemos pedidos individuales y proyectos de mayoreo. Nuestra capacidad actual es de aproximadamente 120 a 150 cuadros mensuales, dependiendo de las medidas y modelos.</p><a href="https://wa.me/525515911166?text=Hola%2C%20quiero%20cotizar%20un%20proyecto%20de%20cuadros" className="mt-7 inline-block rounded-full bg-white px-6 py-3 font-semibold text-stone-900">Solicitar cotización</a></div></section>
      <footer id="contacto" className="mx-auto max-w-7xl px-6 py-10 text-sm text-stone-600"><p className="font-semibold text-stone-900">Cuadros Abigail · Ciudad de México</p><p className="mt-2">WhatsApp: 55 1591 1166 · cuadrosdecorativosabigail@gmail.com</p><p className="mt-2">Envíos a toda la República Mexicana.</p><p className="mt-5">© {new Date().getFullYear()} Cuadros Abigail.</p></footer>
    </main>
  );
}