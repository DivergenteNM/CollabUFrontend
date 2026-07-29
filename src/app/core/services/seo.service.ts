import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

export interface SeoMetaConfig {
  title?: string;
  description?: string;
  keywords?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
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
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly document = inject(DOCUMENT);

  private readonly siteName = 'Collab-U — Universidad de Nariño';
  private readonly defaultTitle = 'Collab-U — Plataforma de Prácticas Profesionales';
  private readonly defaultDescription =
    'Collab-U facilita la gestión de prácticas profesionales, pasantías y proyectos de investigación de la Universidad de Nariño conectando estudiantes y empresas.';
  private readonly defaultOgImage = '/assets/images/og-default.png';

  /**
   * Sets or updates the page title with branding suffix.
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
   * Updates standard meta tags, Open Graph tags, Twitter card tags, and canonical link.
   */
  setMetaTags(config: SeoMetaConfig): void {
    const title = config.title ? (config.title.includes('Collab-U') ? config.title : `${config.title} — Collab-U`) : this.defaultTitle;
    const description = config.description || this.defaultDescription;
    const robots = config.robots || 'index, follow';
    const ogImage = config.ogImage || this.defaultOgImage;
    const ogType = config.ogType || 'website';
    const currentUrl = config.canonicalUrl || (this.document.location ? this.document.location.href : '');

    // Title & standard meta
    this.setTitle(config.title);
    this.metaService.updateTag({ name: 'description', content: description });
    if (config.keywords) {
      this.metaService.updateTag({ name: 'keywords', content: config.keywords });
    }
    this.metaService.updateTag({ name: 'robots', content: robots });

    // Open Graph
    this.metaService.updateTag({ property: 'og:site_name', content: this.siteName });
    this.metaService.updateTag({ property: 'og:title', content: config.ogTitle || title });
    this.metaService.updateTag({ property: 'og:description', content: config.ogDescription || description });
    this.metaService.updateTag({ property: 'og:type', content: ogType });
    this.metaService.updateTag({ property: 'og:image', content: ogImage });
    if (currentUrl) {
      this.metaService.updateTag({ property: 'og:url', content: currentUrl });
    }

    // Twitter Card
    this.metaService.updateTag({ name: 'twitter:card', content: config.twitterCard || 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: config.twitterTitle || config.ogTitle || title });
    this.metaService.updateTag({ name: 'twitter:description', content: config.twitterDescription || config.ogDescription || description });
    this.metaService.updateTag({ name: 'twitter:image', content: config.twitterImage || ogImage });

    // Canonical link
    if (currentUrl) {
      this.setCanonicalUrl(currentUrl);
    }
  }

  /**
   * Updates or creates canonical <link rel="canonical" href="..."> in head.
   */
  setCanonicalUrl(url: string): void {
    let link: HTMLLinkElement | null = this.document.querySelector("link[rel='canonical']");
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  /**
   * Injects or updates JSON-LD structured data in the <head>.
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
   * Removes JSON-LD structured data script.
   */
  removeStructuredData(scriptId = 'json-ld-structured-data'): void {
    const script = this.document.getElementById(scriptId);
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
  }
}
