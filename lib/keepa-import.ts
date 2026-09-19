// Keepa Product.csv[0]: Amazon price changes; time is minutes since 2011-01-01.
// https://github.com/keepacom/api_backend/blob/master/src/main/java/com/keepa/api/backend/structs/Product.java
export function importKeepaResponse(value: unknown) {
  const data=value as {products?: {asin:string;title:string;domainId:number;csv:(number[]|null)[]}[]};
  if (!Array.isArray(data?.products) || data.products.length!==1) throw new Error('Importa una respuesta Keepa con exactamente un producto.');
  const p=data.products[0];
  if (p.domainId!==11) throw new Error('Solo se admite Keepa de Amazon México (domainId 11).');
  const series=p.csv?.[0];
  if (!Array.isArray(series) || !series.length || series.length%2 || series.length>10000) throw new Error('No hay una serie AMAZON válida (csv[0]).');
  const observations=[]; let lastPrice:number|null=null;
  for(let i=0;i<series.length;i+=2){
    const minute=series[i], price=series[i+1];
    if (!Number.isSafeInteger(minute)||minute<0||!Number.isSafeInteger(price)) throw new Error('Serie Keepa inválida.');
    if(price<=0) {
      // Unavailable markers are retained as a break, never as a discount.
      if(lastPrice==null) continue;
    } else lastPrice=price;
    observations.push({at:new Date(Date.UTC(2011,0,1)+minute*60000).toISOString(),totalMinor:lastPrice!,currency:'MXN',offerKey:`keepa:MX:${p.asin}:amazon:new`,inStock:price>0,complete:false});
  }
  if(!observations.length)throw new Error('Keepa no contiene precios positivos para Amazon.');
  return {asin:p.asin,title:p.title,source:'Keepa · cambios de precio Amazon · envío sin confirmar',observations};
}
