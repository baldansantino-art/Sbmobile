const CONFIG = window.SB_CONFIG || {};
const fallbackProducts = [
  {id:"cargador-20w",category:"Cargadores",name:"Cargador Original Apple 20W USB-C",price:0,stock:0,image:"",active:true,icon:"⚡"},
  {id:"cable-cc",category:"Cables",name:"Cable USB-C a USB-C",price:0,stock:0,image:"",active:true,icon:"🔌"},
  {id:"cable-cl",category:"Cables",name:"Cable USB-C a Lightning",price:0,stock:0,image:"",active:true,icon:"🔌"},
  {id:"fundas-13-17",category:"Fundas",name:"Fundas de silicona iPhone 13 al 17",price:0,stock:0,image:"",active:true,icon:"📱"},
  {id:"tws",category:"Audio",name:"Auriculares inalámbricos TWS",price:0,stock:0,image:"",active:true,icon:"🎧"},
  {id:"combo-carga",category:"Combos",name:"Combo Carga",price:70000,stock:0,image:"",active:true,icon:"🔥"},
  {id:"combo-proteccion",category:"Combos",name:"Combo Protección",price:72500,stock:0,image:"",active:true,icon:"🔥"}
];
let products = [];
let cart = JSON.parse(localStorage.getItem("sb_cart") || "[]");

const $ = s => document.querySelector(s);
const money = n => n > 0 ? new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(n) : "Consultar";
const saveCart = () => { localStorage.setItem("sb_cart", JSON.stringify(cart)); renderCart(); updateCount(); };
const whatsappUrl = msg => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;

function init(){
  $("#year").textContent = new Date().getFullYear();
  $("#heroWhatsapp").href = whatsappUrl("Hola SB Mobile 👋 Quiero consultar por un producto.");
  $("#footerWhatsapp").href = $("#heroWhatsapp").href;
  const aw = $("#aboutWhatsapp"); if (aw) aw.href = $("#heroWhatsapp").href;
  $("#openCart").onclick = ()=>toggleCart(true);
  $("#closeCart").onclick = ()=>toggleCart(false);
  $("#drawerBackdrop").onclick = ()=>toggleCart(false);
  $("#checkoutBtn").onclick = openCheckout;
  $("#clearCart").onclick = ()=>{cart=[];saveCart()};
  $("#closeCheckout").onclick = closeCheckout;
  $("#checkoutForm").addEventListener("submit", submitOrder);
  $("#search").addEventListener("input", filterProducts);
  $("#categoryFilter").addEventListener("change", filterProducts);
  document.querySelectorAll(".category-grid button").forEach(b=>b.onclick=()=>{ $("#categoryFilter").value=b.dataset.category; $("#productos").scrollIntoView({behavior:"smooth"}); filterProducts();});
  document.querySelector("[data-jump-combos]").onclick=(e)=>{e.preventDefault();$("#categoryFilter").value="Combos";$("#productos").scrollIntoView({behavior:"smooth"});filterProducts()};
  setupMenu();
  loadProducts();
}
function setupMenu(){
  const menu=$("#sideMenu"), back=$("#menuBackdrop"), openBtn=$("#openMenu");
  if(!menu||!back||!openBtn)return;
  const toggle=open=>{menu.classList.toggle("open",open);back.classList.toggle("open",open);document.body.classList.toggle("menu-open",open);menu.setAttribute("aria-hidden",!open);openBtn.setAttribute("aria-expanded",open)};
  openBtn.onclick=()=>toggle(true);
  $("#closeMenu").onclick=()=>toggle(false);
  back.onclick=()=>toggle(false);
  menu.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>toggle(false)));
  document.addEventListener("keydown",e=>{if(e.key==="Escape")toggle(false)});
  const sw=$("#sideWhatsapp"); if(sw) sw.href=$("#heroWhatsapp").href;
  const links=[...menu.querySelectorAll(".side-nav a")];
  const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting)links.forEach(l=>l.classList.toggle("active",l.getAttribute("href")==="#"+en.target.id))}),{rootMargin:"-45% 0px -50% 0px"});
  links.forEach(l=>{const t=document.querySelector(l.getAttribute("href"));if(t)io.observe(t)});
}
function loadProducts(){
  $("#loading").classList.remove("hidden");
  if(!CONFIG.appsScriptUrl){
    products = fallbackProducts;
    renderProducts(products);
    return;
  }
  const callback = "sbCatalogCallback";
  window[callback] = data => { products = Array.isArray(data) ? data.filter(p=>String(p.active).toLowerCase()!=="false") : fallbackProducts; renderProducts(products); };
  const s=document.createElement("script");
  s.src=`${CONFIG.appsScriptUrl}${CONFIG.appsScriptUrl.includes("?")?"&":"?"}action=catalog&callback=${callback}&t=${Date.now()}`;
  s.onerror=()=>{products=fallbackProducts;renderProducts(products)};
  document.body.appendChild(s);
}
function variantsOf(p){return Array.isArray(p.variants)?p.variants:[]}
function totalStock(p){const v=variantsOf(p);return v.length?v.reduce((t,x)=>t+(Number(x.stock)||0),0):(Number(p.stock)||0)}
function cartKey(x){return x.key||String(x.id)}
function renderProducts(list){
  $("#loading").classList.add("hidden");
  const grid=$("#productGrid"); grid.innerHTML="";
  $("#emptyState").classList.toggle("hidden",list.length!==0);
  list.forEach(p=>{
    const card=document.createElement("article");card.className="product-card";
    const vars=variantsOf(p), hasVars=vars.length>0, total=totalStock(p);
    const canBuy=Number(p.price)>0&&!(hasVars&&total<=0);
    const image=p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">`:"";
    const stock=hasVars?(total>0?`${total} disponible(s) en total`:"Sin stock por ahora"):(Number(p.stock)>0?`${p.stock} disponible(s)`:"Consultar disponibilidad");
    const chips=hasVars?`<div class="variants">${vars.map(v=>{
      const out=(Number(v.stock)||0)<=0, label=esc(v.name)+(out?"":` <small>${esc(v.stock)}</small>`);
      return canBuy?`<button type="button" class="chip${out?" out":""}" data-variant="${esc(v.name)}" ${out?"disabled":""}>${label}</button>`:`<span class="chip static${out?" out":""}">${label}</span>`;
    }).join("")}</div><div class="variant-hint" aria-live="polite"></div>`:"";
    card.innerHTML=`<div class="product-image">${image}<div class="placeholder" style="${p.image?'display:none':''}">${esc(p.icon||"📦")}</div></div>
      <div class="product-body"><div class="tag">${esc(p.category)}</div><div class="product-name">${esc(p.name)}</div>
      <div class="price ${canBuy?'':'consult'}">${money(Number(p.price))}</div><div class="stock">${esc(stock)}</div>${chips}
      <div class="product-actions">
      ${canBuy?`<button class="btn primary" data-add="${esc(p.id)}">Agregar</button>`:`<a class="btn secondary" href="${whatsappUrl("Hola SB Mobile 👋 Quiero consultar por: "+p.name)}" target="_blank">Consultar</a>`}
      </div></div>`;
    const btns=card.querySelectorAll("button.chip"), hint=card.querySelector(".variant-hint"), add=card.querySelector("[data-add]");
    btns.forEach(c=>c.onclick=()=>{btns.forEach(x=>x.classList.remove("selected"));c.classList.add("selected");hint.textContent=""});
    if(add)add.onclick=()=>{
      const sel=card.querySelector("button.chip.selected");
      if(hasVars&&!sel){hint.textContent="Elegí un color";return}
      addToCart(add.dataset.add,sel?sel.dataset.variant:"");
    };
    grid.appendChild(card);
  });
}
function filterProducts(){
  const q=$("#search").value.toLowerCase().trim(), c=$("#categoryFilter").value;
  const list=products.filter(p=>(c==="Todos"||p.category===c)&&(!q||p.name.toLowerCase().includes(q)||p.category.toLowerCase().includes(q)));
  renderProducts(list);
}
function addToCart(id,variant=""){
  const p=products.find(x=>String(x.id)===String(id)); if(!p||Number(p.price)<=0)return;
  const key=variant?`${p.id}|${variant}`:String(p.id);
  const v=variantsOf(p).find(x=>x.name===variant), max=v?Number(v.stock)||0:null;
  const item=cart.find(x=>cartKey(x)===key);
  if(item){ if(max!==null&&item.qty>=max){alert(`Solo hay ${max} disponible(s) en ${variant}.`);return} item.qty++; }
  else { if(max!==null&&max<=0)return; cart.push({key,id:p.id,name:p.name,variant,price:Number(p.price),qty:1,max}); }
  saveCart();toggleCart(true);
}
function updateCount(){ $("#cartCount").textContent=cart.reduce((a,x)=>a+x.qty,0); }
function renderCart(){
  const el=$("#cartItems");
  if(!cart.length){el.innerHTML='<div class="empty">Tu carrito está vacío.</div>';}
  else el.innerHTML=cart.map(x=>`<div class="cart-line"><div><div class="cart-line-name">${esc(x.name)}${x.variant?` · <span class="cart-variant">${esc(x.variant)}</span>`:""}</div><small>${money(x.price)} c/u</small></div><div class="qty"><button data-dec="${esc(cartKey(x))}">−</button><span>${x.qty}</span><button data-inc="${esc(cartKey(x))}">+</button></div></div>`).join("");
  el.querySelectorAll("[data-inc]").forEach(b=>b.onclick=()=>changeQty(b.dataset.inc,1));
  el.querySelectorAll("[data-dec]").forEach(b=>b.onclick=()=>changeQty(b.dataset.dec,-1));
  const total=cart.reduce((a,x)=>a+x.price*x.qty,0);$("#cartTotal").textContent=money(total);$("#checkoutTotal").textContent=money(total);
}
function changeQty(key,d){const x=cart.find(i=>cartKey(i)===key);if(!x)return;if(d>0&&x.max!=null&&x.qty>=x.max)return;x.qty+=d;if(x.qty<=0)cart=cart.filter(i=>cartKey(i)!==key);saveCart()}
function toggleCart(show){$("#cartDrawer").classList.toggle("hidden",!show);$("#drawerBackdrop").classList.toggle("hidden",!show)}
function openCheckout(){if(!cart.length){alert("Agregá al menos un producto con precio al carrito.");return}toggleCart(false);$("#checkoutModal").classList.remove("hidden");}
function closeCheckout(){$("#checkoutModal").classList.add("hidden");$("#checkoutStatus").textContent=""}
function submitOrder(e){
  e.preventDefault();
  if(!CONFIG.appsScriptUrl){$("#checkoutStatus").textContent="La tienda está en modo demostración. Configurá el Apps Script para registrar pedidos.";return;}
  const f=new FormData(e.target), total=cart.reduce((a,x)=>a+x.price*x.qty,0);
  const order={orderId:"SB-"+Date.now().toString().slice(-7),createdAt:new Date().toISOString(),customer:f.get("nombre"),phone:f.get("telefono"),model:f.get("modelo"),delivery:f.get("entrega"),payment:f.get("pago"),notes:f.get("notas"),items:cart,total};
  $("#checkoutStatus").textContent="Enviando pedido...";
  const form=document.createElement("form");form.method="POST";form.action=CONFIG.appsScriptUrl;form.target="orderFrame";form.style.display="none";
  const input=document.createElement("input");input.name="payload";input.value=JSON.stringify(order);form.appendChild(input);document.body.appendChild(form);
  form.submit();
  setTimeout(()=>{
    const msg=`Hola SB Mobile 👋 Acabo de realizar el pedido ${order.orderId}.%0A%0A${cart.map(x=>`• ${x.name}${x.variant?" ("+x.variant+")":""} x${x.qty}`).join("%0A")}%0A%0ATotal: ${money(total)}%0ANombre: ${order.customer}%0AWhatsApp: ${order.phone}%0AEntrega: ${order.delivery}%0APago: ${order.payment}`;
    $("#checkoutStatus").innerHTML=`Pedido <b>${order.orderId}</b> enviado. Ahora podés terminar la coordinación por WhatsApp. <a href="${whatsappUrl(decodeURIComponent(msg))}" target="_blank">Abrir WhatsApp</a>`;
    cart=[];saveCart();e.target.reset();
  },900);
}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
document.addEventListener("DOMContentLoaded",()=>{init();renderCart();updateCount()});