<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3';
import { computed } from 'vue';

defineOptions({
  inheritAttrs: false
});

interface CropVariant {
  publicUrl?: string | null;
}

interface ContactImage extends MediaRef {
  alternative?: string | null;
  description?: string | null;
  cropVariants?: {
    default?: CropVariant;
    small?: CropVariant;
    [key: string]: CropVariant | undefined;
  };
}

interface ContactPerson {
  degree?: string;
  firstname?: string;
  lastname?: string;
  function?: Array<string | { title?: string; label?: string; value?: string }>;
  image?: ContactImage[] | null;
  mail?: string;
  phone?: LinkRef | null;
}

interface T3CeRcgContactlist extends T3CeBaseProps {
  header?: string;
  subheader?: string;
  contactlist?: ContactPerson[];
  space_before_class?: string;
  space_after_class?: string;
}

type ContactCard = {
  key: string;
  headingId: string;
  fullName: string;
  degree: string;
  functions: string[];
  mailHref?: string;
  mailLabel?: string;
  phoneHref?: string;
  phoneLabel?: string;
  imageUrlDefault?: string;
  imageUrlSmall?: string;
  imageAlt: string;
};

const props = withDefaults(defineProps<T3CeRcgContactlist>(), {
  header: '',
  subheader: '',
  contactlist: () => [],
  space_before_class: '',
  space_after_class: ''
});

const sectionHeadingId = computed(() => `contactlist-heading-${props.uid ?? 'content'}`);

const spacingClasses = computed(() => [props.space_before_class, props.space_after_class].filter(Boolean));

const normalizePhoneHref = (phone?: LinkRef | null): string | undefined => {
  const raw = phone?.url || phone?.attr?.href || phone?.config?.parameter || '';
  if (!raw) return undefined;
  if (raw.startsWith('tel:')) return raw;
  return `tel:${raw.replace(/\s+/g, '')}`;
};

const normalizeFunctions = (entry?: ContactPerson['function']): string[] => {
  if (!Array.isArray(entry)) return [];

  return entry
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (!item || typeof item !== 'object') return '';
      return (item.title || item.label || item.value || '').trim();
    })
    .filter(Boolean);
};

const contactCards = computed<ContactCard[]>(() => {
  return (props.contactlist ?? []).map((contact, index) => {
    const firstname = contact.firstname?.trim() || '';
    const lastname = contact.lastname?.trim() || '';
    const degree = contact.degree?.trim() || '';
    const fullName = [firstname, lastname].filter(Boolean).join(' ').trim() || `Kontakt ${index + 1}`;
    const portrait = (contact.image ?? []).find((item) => item?.publicUrl || item?.cropVariants?.default?.publicUrl) || null;
    const imageUrlDefault = portrait?.cropVariants?.default?.publicUrl || portrait?.publicUrl || undefined;
    const imageUrlSmall = portrait?.cropVariants?.small?.publicUrl || imageUrlDefault;
    const imageAlt = portrait?.alt?.trim()
      || portrait?.alternative?.trim()
      || portrait?.description?.trim()
      || `Porträt von ${fullName}`;

    const mail = contact.mail?.trim();
    const mailHref = mail ? `mailto:${mail}` : undefined;
    const phoneHref = normalizePhoneHref(contact.phone);
    const phoneLabel = contact.phone?.title?.trim() || (phoneHref ? phoneHref.replace(/^tel:/, '') : undefined);

    return {
      key: `${props.uid ?? 'content'}-${index}-${fullName}`,
      headingId: `contact-card-${props.uid ?? 'content'}-${index}`,
      fullName,
      degree,
      functions: normalizeFunctions(contact.function),
      mailHref,
      mailLabel: mail || undefined,
      phoneHref,
      phoneLabel,
      imageUrlDefault,
      imageUrlSmall,
      imageAlt
    };
  });
});
</script>

<template>
  <section :class="spacingClasses" :aria-labelledby="header ? sectionHeadingId : undefined">
    <div class="contactlist-surface">
      <UContainer>
        <div class="contactlist-inner">
          <header v-if="header || subheader" class="contactlist-head">
            <div v-if="header" :id="sectionHeadingId" class="contactlist-title">
              <T3HtmlParser :content="header" />
            </div>
            <div v-if="subheader" class="contactlist-subtitle">
              <T3HtmlParser :content="subheader" />
            </div>
          </header>

          <ul class="contactlist-grid" role="list">
            <li
              v-for="card in contactCards"
              :key="card.key"
              class="contactlist-item"
            >
              <article class="contact-card" :aria-labelledby="card.headingId">
                <div class="contact-image-wrap">
                  <picture v-if="card.imageUrlDefault">
                    <source :srcset="card.imageUrlDefault" media="(min-width: 1024px)" />
                    <img
                      :src="card.imageUrlSmall || card.imageUrlDefault"
                      :alt="card.imageAlt"
                      loading="lazy"
                      decoding="async"
                      class="contact-image"
                    >
                  </picture>
                  <div v-else class="contact-image-fallback" aria-hidden="true" />
                </div>

                <div class="contact-content">
                  <p v-if="card.degree" class="contact-degree">{{ card.degree }}</p>
                  <h3 :id="card.headingId" class="contact-name">{{ card.fullName }}</h3>

                  <ul v-if="card.functions.length" class="contact-functions" role="list">
                    <li v-for="(role, roleIndex) in card.functions" :key="`${card.key}-role-${roleIndex}`">
                      {{ role }}
                    </li>
                  </ul>

                  <p v-if="card.mailHref" class="contact-line">
                    <a :href="card.mailHref" class="contact-link" :aria-label="`E-Mail an ${card.fullName} schreiben`">
                      {{ card.mailLabel }}
                    </a>
                  </p>
                  <p v-if="card.phoneHref" class="contact-line">
                    <a :href="card.phoneHref" class="contact-link" :aria-label="`Telefonnummer von ${card.fullName} anrufen`">
                      {{ card.phoneLabel }}
                    </a>
                  </p>

                  <a
                    v-if="card.mailHref"
                    :href="card.mailHref"
                    class="contact-cta"
                    :aria-label="`Nachricht an ${card.fullName} senden`"
                  >
                    Nachricht
                  </a>
                </div>
              </article>
            </li>
          </ul>
        </div>
      </UContainer>
    </div>
  </section>
</template>

<style scoped>
.contactlist-surface {
  background: #e9eaec;
  padding: clamp(2rem, 4vw, 4rem) 0;
}

.contactlist-inner {
  position: relative;
}

.contactlist-head {
  margin-bottom: clamp(1.5rem, 2.2vw, 2.75rem);
  text-align: left;
}

.contactlist-title :deep(h1),
.contactlist-title :deep(h2),
.contactlist-title :deep(h3) {
  margin: 0;
  color: var(--color-primary);
  font-size: clamp(2rem, 4.5vw, 3rem);
  line-height: 1.1;
  font-weight: 500;
}

.contactlist-subtitle {
  margin-top: 0.9rem;
  color: rgb(17 24 39 / 0.85);
  font-size: 1.05rem;
}

.contactlist-subtitle :deep(p) {
  margin: 0;
}

.contactlist-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: clamp(1.25rem, 2.4vw, 2.25rem);
  list-style: none;
  margin: 0;
  padding: 0;
}

.contact-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.contact-image-wrap {
  aspect-ratio: 5 / 7;
  background: #d4d4d8;
}

.contact-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.contact-image-fallback {
  width: 100%;
  height: 100%;
  background: linear-gradient(130deg, #cfd3da 20%, #b7beca 100%);
}

.contact-content {
  padding-top: 0.7rem;
}

.contact-degree {
  margin: 0;
  color: #60636a;
  font-size: 1rem;
  line-height: 1.2;
  font-weight: 700;
}

.contact-name {
  margin: 0.1rem 0 0;
  color: #5b5f66;
  font-size: clamp(1.7rem, 2.5vw, 2.25rem);
  line-height: 1;
  font-weight: 700;
}

.contact-functions {
  margin: 0.7rem 0 0;
  padding: 0;
  list-style: none;
  color: #5b5f66;
  font-weight: 600;
}

.contact-line {
  margin: 0.3rem 0 0;
}

.contact-link {
  color: var(--color-primary);
  text-decoration: none;
  word-break: break-word;
}

.contact-link:hover,
.contact-link:focus-visible {
  text-decoration: underline;
}

.contact-cta {
  display: inline-flex;
  margin-top: 1rem;
  border: 2px solid var(--color-primary);
  border-radius: 0.2rem;
  padding: 0.58rem 1rem;
  color: var(--color-primary);
  font-weight: 700;
  text-transform: uppercase;
  text-decoration: none;
  letter-spacing: 0.02em;
}

.contact-cta:hover {
  background: rgb(37 99 235 / 0.06);
}

.contact-cta:focus-visible,
.contact-link:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
}

@media (min-width: 640px) {
  .contactlist-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .contactlist-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
