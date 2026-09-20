/**
 * The embed shell: no header, no footer, no navigation.
 *
 * `?theme=light|dark` is honoured by the inline script below rather than by
 * reading `searchParams` in the page, because reading search params opts a
 * route out of static prerendering. These pages are framed on other people's
 * sites and must be served from the CDN edge as static HTML, so the theme is
 * applied on the client — before first paint, so there is no flash.
 */
const embedThemeScript = `(function(){try{
var t=new URLSearchParams(location.search).get('theme');
if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}
}catch(e){}})();`;

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script>{embedThemeScript}</script>
      <main className="flex-1 p-4">{children}</main>
    </>
  );
}
