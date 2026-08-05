# DNS — `avro.work`

Configura los registros de abajo en tu proveedor DNS
(Cloudflare, Namecheap, GoDaddy, Porkbun, Google Domains, Squarespace Domains, etc.)
para que `avro.work` resuelva al sitio publicado en GitHub Pages
(el archivo `CNAME` con `avro.work` ya está commiteado en este repo).

> El certificado HTTPS lo emite GitHub Pages automáticamente con Let's Encrypt
> en cuanto detecta el dominio en `Settings → Pages`. Suele tardar 5–15 min.
> Si Cloudflare está en medio, asegúrate de que los registros `A` estén en
> modo **DNS only** (nube gris, no naranja) o el certificado no se emite.

---

## 1. Registros requeridos

### Apex (`avro.work`) — 4 registros `A`

| Tipo | Host | Valor              | TTL  |
|------|------|--------------------|------|
| A    | @    | `185.199.108.153`  | 3600 |
| A    | @    | `185.199.109.153`  | 3600 |
| A    | @    | `185.199.110.153`  | 3600 |
| A    | @    | `185.199.111.153`  | 3600 |

Las cuatro IPs son los **cualquiera-cast de GitHub Pages**. Si cambian, consulta:
https://docs.github.com/pages/configuring-a-custom-domain-with-github-pages/managing-a-custom-domain-appended-to-your-github-pages-site/

### Subdominio `www` — 1 registro `CNAME`

| Tipo  | Host | Valor                 | TTL  |
|-------|------|-----------------------|------|
| CNAME | www  | `avrowork.github.io.` | 3600 |

Alternativa válida para `www`: `CNAME www → avro.work` (apunta `www` al apex).
GitHub Pages redirige automáticamente entre apex y `www` si ambos resuelven.

---

## 2. Formato zone file (BIND / RFC 1035)

Para proveedores que aceptan import de zona (Cloudflare con
`Importar zonefile`, Bind9, TinyDNS, instancias DNS custom):

```bind
$ORIGIN avro.work.
$TTL 3600

@       IN  A       185.199.108.153
@       IN  A       185.199.109.153
@       IN  A       185.199.110.153
@       IN  A       185.199.111.153

www     IN  CNAME   avrowork.github.io.
```

> El punto final en `avrowork.github.io.` es el FQDN absoluto — en formatos
> UI-based se omite.

---

## 3. Por proveedor (UI paso a paso)

### Cloudflare

1. Selecciona `avro.work` → **DNS** → **Records**.
2. Quita cualquier `A` o `CNAME` previo en apex y `www` que puedas tener.
3. Añade los **4 registros A** con `Name=@`, valor = cada IP, TTL = Auto.
   Asegúrate de que el toggle **Proxy** queda en **DNS only** (gris), no en *Proxied* (naranja). Si está en Proxied GitHub Pages no podrá emitir el certificado.
4. Añade el `CNAME`: `Name=www`, `Target=avrowork.github.io`, Proxy = **DNS only**.
5. **SSL/TLS** → Overview → modo **Full** (no *Full (strict)* hasta que veas el cert activo).
6. Espera 1–5 min para SSL, hasta 48 h para DNS global si cambiaste de nameservers.

### Namecheap

1. Domain List → `avro.work` → **Manage** → **Advanced DNS**.
2. Para los 4 `A Records`: Host = `@`, Value = IP, TTL = Automatic.
3. Para `www`: Host = `www`, Type = `CNAME`, Value = `avrowork.github.io`.
4. Si quieres solo el apex, no crees el CNAME de `www`.

### GoDaddy

1. My Products → `avro.work` → DNS → **Manage Zones**.
2. Añade los 4 `A` records con Name = `@`, Value = cada IP, TTL 600 s (o 1 h).
3. Añade `CNAME` con Name = `www`, Value = `avrowork.github.io`.
4. Si tu plan no permite CNAMEs al apex, usa *URL Redirect* para `www`.

### Porkbun

1. Details → **DNS Records** → Add.
2. Type `A` × 4 con Host = `avro.work` (sin prefijo `www`), Value = cada IP.
3. Type `CNAME` con Host = `www.avro.work`, Target = `avrowork.github.io`.

### Google Domains → Squarespace Domains

1. Manage → DNS → **Custom records**.
2. 4 `A` records (Host = `@`, Data = IP) + 1 `CNAME` (Host = `www`, Data = `avrowork.github.io`).

### Otros (Hover, DNSimple, OVH, Hetzner, Route 53)

El patrón es idéntico: **4 A para apex + 1 CNAME para www**.
En Route 53 crea una hosted zone para `avro.work` y aplica los mismos
records; AWS deduce el apex desde la zona.

---

## 4. Verificación

### Comprobaciones de DNS (terminal)

```bash
dig avro.work A +short
# esperado:
# 185.199.108.153
# 185.199.109.153
# 185.199.110.153
# 185.199.111.153

dig www.avro.work CNAME +short
# esperado: avrowork.github.io.

nslookup avro.work
# confirma que resuelve a una de las IPs anteriores
```

También puedes usar verificadores online:
- https://dnschecker.org/#A/avro.work
- https://www.whatsmydns.net/#A/avro.work
- https://github.com/cdn-updater/github-pages-health-check (después del deploy)

### Comprobación de HTTPS

Una vez propagado DNS, abre https://avro.work. Si ves:

- **404 / no resuelve** → DNS aún no propaga o `CNAME` falta en el repo.
- **"Your connection is not private"** → GitHub Pages aún no emitió el cert (espera 5–60 min).
- **Cert válido + tu sitio** → todo OK. Verifica que `og:image`, `canonical`
  y `sitemap.xml` muestran `https://avro.work/...`.

Para forzar refresh y saltar caché del navegador: `Ctrl+Shift+R` (Windows/Linux)
o `Cmd+Shift+R` (macOS).

### Estado del cert en GitHub

Ve a https://github.com/avrowork/avrowork.github.io/settings/pages
y busca el ítem **"Custom domain"**. Cuando GitHub propague el cert aparecerá
la marca **"HTTPS available"** o similar.

---

## 5. Troubleshooting rápido

| Síntoma                                       | Causa probable                                      | Fix                                              |
|-----------------------------------------------|------------------------------------------------------|--------------------------------------------------|
| `dig avro.work` no devuelve nada              | DNS aún no propaga                                   | Espera. TTL alto. Prueba con `dig @8.8.8.8 …`    |
| `avro.work` carga pero sin HTTPS              | Cert aún no emitido                                  | Espera 30 min; revisa *Settings → Pages*         |
| `www.avro.work` no carga                      | Falta CNAME o apex-only setup                        | Crea el CNAME o elige apex como primary          |
| Cloudflare muestra 1016 / 521                 | Proxy enabled para los `A`                          | Pon **DNS only** en cada A-record                |
| Bucle de redirect infinito                    | Apex y www circular                                  | Quita el redirect. Configura www → apex simple   |

---

## 6. Resumen en 5 líneas

```
A     @    185.199.108.153
A     @    185.199.109.153
A     @    185.199.110.153
A     @    185.199.111.153
CNAME www  avrowork.github.io.
```

Cinco líneas. Esas son todas las configuraciones que importan.
