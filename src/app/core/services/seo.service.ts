import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

export interface SeoMetaConfig {
  title?: string;
  description?: string;
  keywords?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogUrl?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly document = inject(DOCUMENT);

  private readonly siteName = 'Collab-U — Universidad de Nariño';
  private readonly defaultTitle = 'Collab-U — Plataforma de Prácticas Profesionales';
  private readonly defaultDescription =
    'Collab-U facilita la gestión de prácticas profesionales, pasantías y vinculación formativa de la Universidad de Nariño conectando estudiantes y empresas colaboradoras.';
  private readonly defaultOgImage = '/Logo_CollabU_Color_texto.png';
  private readonly defaultSiteUrl = environment.siteUrl || 'https://collab-u.udenar.edu.co';

  /**
   * Obtiene la URL base absoluta según la plataforma (navegador o SSR).
   */
  getBaseUrl(): string {
    if (isPlatformBrowser(this.platformId) && this.document.location?.origin) {
      return this.document.location.origin;
    }
    return this.defaultSiteUrl;
  }

  /**
   * Convierte cualquier ruta relativa en URL absoluta completa.
   * Obligatorio para rastreadores como WhatsApp, LinkedIn, Facebook y Twitter/X.
   */
  toAbsoluteUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const base = this.getBaseUrl().replace(/\/+$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  }

  /**
   * Establece o actualiza el título del documento con sufijo institucional.
   */
  setTitle(title?: string): void {
    if (!title) {
      this.titleService.setTitle(this.defaultTitle);
      return;
    }

    const fullTitle = title.includes('Collab-U') ? title : `${title} — Collab-U`;
    this.titleService.setTitle(fullTitle);
  }

  /**
   * Actualiza etiquetas estándar, Open Graph, Twitter Cards y link canónico.
   */
  setMetaTags(config: SeoMetaConfig): void {
    const title = config.title
      ? (config.title.includes('Collab-U') ? config.title : `${config.title} — Collab-U`)
      : this.defaultTitle;
    const description = config.description || this.defaultDescription;
    const robots = config.robots || 'index, follow';
    const ogImageAbsolute = this.toAbsoluteUrl(config.ogImage || this.defaultOgImage);
    const ogType = config.ogType || 'website';
    const currentUrlAbsolute = config.canonicalUrl
      ? this.toAbsoluteUrl(config.canonicalUrl)
      : (isPlatformBrowser(this.platformId) && this.document.location?.href
          ? this.document.location.href
          : this.defaultSiteUrl);

    // 1. Título & Meta estándar
    this.setTitle(config.title);
    this.metaService.updateTag({ name: 'description', content: description });
    if (config.keywords) {
      this.metaService.updateTag({ name: 'keywords', content: config.keywords });
    }
    this.metaService.updateTag({ name: 'robots', content: robots });

    // 2. Open Graph (WhatsApp, LinkedIn, Facebook)
    this.metaService.updateTag({ property: 'og:site_name', content: this.siteName });
    this.metaService.updateTag({ property: 'og:locale', content: 'es_CO' });
    this.metaService.updateTag({ property: 'og:title', content: config.ogTitle || title });
    this.metaService.updateTag({ property: 'og:description', content: config.ogDescription || description });
    this.metaService.updateTag({ property: 'og:type', content: ogType });
    this.metaService.updateTag({ property: 'og:image', content: ogImageAbsolute });
    this.metaService.updateTag({ property: 'og:image:alt', content: config.ogImageAlt || title });
    if (currentUrlAbsolute) {
      this.metaService.updateTag({ property: 'og:url', content: currentUrlAbsolute });
    }

    // 3. Twitter Cards (X)
    this.metaService.updateTag({ name: 'twitter:card', content: config.twitterCard || 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:site', content: '@Udenar' });
    this.metaService.updateTag({ name: 'twitter:title', content: config.twitterTitle || config.ogTitle || title });
    this.metaService.updateTag({ name: 'twitter:description', content: config.twitterDescription || config.ogDescription || description });
    this.metaService.updateTag({ name: 'twitter:image', content: config.twitterImage ? this.toAbsoluteUrl(config.twitterImage) : ogImageAbsolute });

    // 4. Canonical link
    if (currentUrlAbsolute) {
      this.setCanonicalUrl(currentUrlAbsolute);
    }
  }

  /**
   * Actualiza o crea el enlace <link rel="canonical" href="..."> en el <head>.
   */
  setCanonicalUrl(url: string): void {
    const absoluteUrl = this.toAbsoluteUrl(url);
    let link: HTMLLinkElement | null = this.document.querySelector("link[rel='canonical']");
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', absoluteUrl);
  }

  /**
   * Inyecta o actualiza datos estructurados JSON-LD en el <head>.
   */
  setStructuredData(schema: object | object[], scriptId = 'json-ld-structured-data'): void {
    let script = this.document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = this.document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }
    script.text = JSON.stringify(schema);
  }

  /**
   * Inyecta el esquema institucional de la Universidad de Nariño y la aplicación Collab-U.
   */
  setInstitutionalStructuredData(): void {
    const baseUrl = this.getBaseUrl();
    const schema = [
      {
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        'name': 'Universidad de Nariño',
        'url': 'https://www.udenar.edu.co',
        'logo': this.toAbsoluteUrl(this.defaultOgImage),
        'department': {
          '@type': 'Organization',
          'name': 'Collab-U — Plataforma de Gestión de Prácticas Profesionales',
          'url': baseUrl,
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'Collab-U',
        'applicationCategory': 'EducationalApplication',
        'operatingSystem': 'All',
        'browserRequirements': 'Requires JavaScript and HTML5 support',
        'description': this.defaultDescription,
        'url': baseUrl,
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'COP',
        },
      },
    ];
    this.setStructuredData(schema, 'institutional-schema');
  }

  /**
   * Elimina un script de datos estructurados JSON-LD.
   */
  removeStructuredData(scriptId = 'json-ld-structured-data'): void {
    const script = this.document.getElementById(scriptId);
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
  }
}
