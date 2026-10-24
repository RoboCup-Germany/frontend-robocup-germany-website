<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3';
import { computed, nextTick, ref, useId } from 'vue';
import SectionHeader from '~/components/basic/SectionHeader.vue';

defineOptions({
  inheritAttrs: false
});

interface MailingList {
  uid: number;
  title?: string;
  address?: string;
  description?: string;
}

interface SubscribeForm {
  endpoint?: string;
  method?: string;
  contentElement?: number;
  honeypotField?: string;
}

interface SubscribeResponse {
  ok?: boolean;
  status?: string;
  error?: string;
}

type LocaleItem = {
  active?: number;
  twoLetterIsoCode?: string;
  hreflang?: string;
};

type ErrorKey = 'invalidEmail' | 'privacyRequired' | 'tooManyRequests' | 'unavailable';

interface Props extends T3CeBaseProps {
  header?: string;
  subheader?: string;
  bodytext?: string;
  mailinglist?: MailingList | null;
  button_label?: string;
  privacy_link?: LinkRef | null;
  success_text?: string;
  form?: SubscribeForm | null;
}

const props = withDefaults(defineProps<Props>(), {
  header: '',
  subheader: '',
  bodytext: '',
  mailinglist: null,
  button_label: '',
  privacy_link: null,
  success_text: '',
  form: null
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_NAME_LENGTH = 100;

const { pageData } = useT3Api();
const route = useRoute();
const { normalize } = useCmsLink();

// The WM site is English without an /en prefix, so the active TYPO3 language wins over the path.
const isEnglishPage = computed(() => {
  const locales = (pageData.value as { i18n?: LocaleItem[] } | null)?.i18n;
  const activeLocale = Array.isArray(locales) ? locales.find((item) => item?.active === 1) : null;
  const iso = (activeLocale?.twoLetterIsoCode || '').toLowerCase();
  const hreflang = (activeLocale?.hreflang || '').toLowerCase();

  if (iso || hreflang) {
    return iso === 'en' || hreflang.startsWith('en');
  }

  return route.path === '/en' || route.path.startsWith('/en/');
});

const labels = computed(() => {
  if (isEnglishPage.value) {
    return {
      list: 'Mailing list',
      email: 'Email address',
      name: 'Name',
      optional: 'optional',
      required: 'required',
      privacyBefore: 'I have read the ',
      privacyLink: 'privacy policy',
      privacyAfter: ' and agree to the processing of my data for the subscription.',
      submit: 'Subscribe',
      sending: 'Sending...',
      success: '<p>Almost done! Please confirm your subscription via the link in the email we just sent you.</p>',
      honeypot: 'Please leave this field empty',
      errors: {
        invalidEmail: 'Please enter a valid email address.',
        privacyRequired: 'Please accept the privacy policy.',
        tooManyRequests: 'Too many attempts. Please try again later.',
        unavailable: 'Subscribing is not possible right now. Please try again later.'
      } satisfies Record<ErrorKey, string>
    };
  }

  return {
    list: 'Mailingliste',
    email: 'E-Mail-Adresse',
    name: 'Name',
    optional: 'optional',
    required: 'Pflichtfeld',
    privacyBefore: 'Ich habe die ',
    privacyLink: 'Datenschutzerklärung',
    privacyAfter: ' gelesen und bin mit der Verarbeitung meiner Daten zur Anmeldung einverstanden.',
    submit: 'Anmelden',
    sending: 'Wird gesendet...',
    success: '<p>Fast geschafft! Bitte bestätige deine Anmeldung über den Link in der E-Mail, die wir dir gerade geschickt haben.</p>',
    honeypot: 'Dieses Feld bitte leer lassen',
    errors: {
      invalidEmail: 'Bitte gib eine gültige E-Mail-Adresse ein.',
      privacyRequired: 'Bitte stimme der Datenschutzerklärung zu.',
      tooManyRequests: 'Zu viele Versuche. Bitte versuche es später erneut.',
      unavailable: 'Die Anmeldung ist gerade nicht möglich. Bitte versuche es später erneut.'
    } satisfies Record<ErrorKey, string>
  };
});

const hasForm = computed(() => Boolean(props.mailinglist && props.form?.endpoint && props.form?.contentElement));
const honeypotField = computed(() => props.form?.honeypotField || 'website');
const submitLabel = computed(() => props.button_label?.trim() || labels.value.submit);
const successHtml = computed(() => (props.success_text?.trim() ? props.success_text : labels.value.success));

const privacyHref = computed(() => normalize(props.privacy_link?.url || props.privacy_link?.attr?.href || undefined));
const privacyTarget = computed(() => props.privacy_link?.target || undefined);
const privacyRel = computed(() => (privacyTarget.value === '_blank' ? 'noopener noreferrer' : undefined));

const baseId = useId();
const ids = {
  email: `${baseId}-email`,
  emailError: `${baseId}-email-error`,
  name: `${baseId}-name`,
  privacy: `${baseId}-privacy`,
  privacyError: `${baseId}-privacy-error`,
  honeypot: `${baseId}-hp`
};

const email = ref('');
const name = ref('');
const privacy = ref(false);
const honeypotValue = ref('');

const isSubmitting = ref(false);
const isSuccess = ref(false);
const emailError = ref<ErrorKey | null>(null);
const privacyError = ref<ErrorKey | null>(null);
const formError = ref<ErrorKey | null>(null);

const statusRef = ref<HTMLElement | null>(null);
const successRef = ref<HTMLElement | null>(null);

const hasErrors = computed(() => Boolean(emailError.value || privacyError.value || formError.value));

const focusMessage = async (target: typeof statusRef) => {
  await nextTick();
  target.value?.focus();
};

const validate = (): boolean => {
  const trimmedEmail = email.value.trim();
  emailError.value = !trimmedEmail || trimmedEmail.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(trimmedEmail)
    ? 'invalidEmail'
    : null;
  privacyError.value = privacy.value ? null : 'privacyRequired';

  return !emailError.value && !privacyError.value;
};

const resolveErrorKey = (statusCode: number | undefined, code: string | undefined): ErrorKey => {
  if (code === 'invalid_email') {
    return 'invalidEmail';
  }

  if (code === 'privacy_required') {
    return 'privacyRequired';
  }

  if (code === 'too_many_requests' || statusCode === 429) {
    return 'tooManyRequests';
  }

  return 'unavailable';
};

const onSubmit = async () => {
  if (import.meta.server || isSubmitting.value || !hasForm.value || !props.form?.endpoint) {
    return;
  }

  formError.value = null;

  if (!validate()) {
    await focusMessage(statusRef);
    return;
  }

  isSubmitting.value = true;

  try {
    // Sent straight to TYPO3 (not via /api/typo3), so its per-IP rate limit sees the visitor's address.
    const response = await $fetch<SubscribeResponse>(props.form.endpoint, {
      method: 'POST',
      body: {
        contentElement: props.form.contentElement,
        email: email.value.trim(),
        name: name.value.trim().slice(0, MAX_NAME_LENGTH),
        privacy: true,
        [honeypotField.value]: honeypotValue.value
      }
    });

    if (!response?.ok) {
      formError.value = resolveErrorKey(undefined, response?.error);
      await focusMessage(statusRef);
      return;
    }

    isSuccess.value = true;
    await focusMessage(successRef);
  } catch (error) {
    const fetchError = error as { statusCode?: number; data?: SubscribeResponse | null };
    const key = resolveErrorKey(fetchError?.statusCode, fetchError?.data?.error);

    if (key === 'invalidEmail') {
      emailError.value = key;
    } else if (key === 'privacyRequired') {
      privacyError.value = key;
    } else {
      formError.value = key;
    }

    await focusMessage(statusRef);
  } finally {
    isSubmitting.value = false;
  }
};

const onEmailInput = () => {
  emailError.value = null;
};

const onPrivacyChange = () => {
  privacyError.value = null;
};
</script>

<template>
  <UContainer>
    <div class="flex flex-col items-start">
      <SectionHeader
        :header="header"
        :subheader="subheader"
        subheader-class="mb-4 text-base italic uppercase tracking-wide text-black font-semibold"
      />

      <div v-if="bodytext" class="mb-4 w-full">
        <T3HtmlParser class="rte-content" :content="bodytext" />
      </div>

      <div v-if="hasForm" class="mb-6 w-full max-w-2xl rounded-2xl border border-primary/20 bg-white p-4 lg:p-6">
        <div v-if="mailinglist?.title || mailinglist?.description" class="mb-4">
          <p v-if="mailinglist?.title" class="mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">
            {{ labels.list }}: {{ mailinglist.title }}
          </p>
          <p v-if="mailinglist?.description" class="mb-0 text-sm text-black/85">
            {{ mailinglist.description }}
          </p>
        </div>

        <div
          v-if="isSuccess"
          ref="successRef"
          tabindex="-1"
          role="status"
          aria-live="polite"
          class="rounded-lg border border-primary/30 bg-primary/5 p-4 text-black outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <T3HtmlParser class="rte-content" :content="successHtml" />
        </div>

        <form
          v-else
          novalidate
          class="flex flex-col gap-4"
          :aria-busy="isSubmitting"
          @submit.prevent="onSubmit"
        >
          <div
            ref="statusRef"
            tabindex="-1"
            aria-live="polite"
            class="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ul
              v-if="hasErrors"
              class="m-0 list-none rounded-lg border border-red-600/40 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              <li v-if="formError">{{ labels.errors[formError] }}</li>
              <li v-if="emailError">{{ labels.errors[emailError] }}</li>
              <li v-if="privacyError">{{ labels.errors[privacyError] }}</li>
            </ul>
          </div>

          <div>
            <label :for="ids.email" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-black/70">
              {{ labels.email }} <span aria-hidden="true">*</span>
              <span class="sr-only">({{ labels.required }})</span>
            </label>
            <input
              :id="ids.email"
              v-model="email"
              type="email"
              name="email"
              autocomplete="email"
              inputmode="email"
              required
              :maxlength="MAX_EMAIL_LENGTH"
              :disabled="isSubmitting"
              :aria-invalid="emailError ? 'true' : undefined"
              :aria-describedby="emailError ? ids.emailError : undefined"
              class="w-full rounded-lg border bg-white px-3 py-2 text-base text-black outline-none focus:border-primary disabled:cursor-wait disabled:opacity-70"
              :class="emailError ? 'border-red-600' : 'border-primary/30'"
              @input="onEmailInput"
            >
            <p v-if="emailError" :id="ids.emailError" class="mt-1 mb-0 text-sm text-red-700">
              {{ labels.errors[emailError] }}
            </p>
          </div>

          <div>
            <label :for="ids.name" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-black/70">
              {{ labels.name }} <span class="font-normal normal-case">({{ labels.optional }})</span>
            </label>
            <input
              :id="ids.name"
              v-model="name"
              type="text"
              name="name"
              autocomplete="name"
              :maxlength="MAX_NAME_LENGTH"
              :disabled="isSubmitting"
              class="w-full rounded-lg border border-primary/30 bg-white px-3 py-2 text-base text-black outline-none focus:border-primary disabled:cursor-wait disabled:opacity-70"
            >
          </div>

          <!-- Honeypot: invisible to people, bots tend to fill it. -->
          <div class="sr-only" aria-hidden="true">
            <label :for="ids.honeypot">{{ labels.honeypot }}</label>
            <input
              :id="ids.honeypot"
              v-model="honeypotValue"
              type="text"
              :name="honeypotField"
              tabindex="-1"
              autocomplete="off"
            >
          </div>

          <div>
            <div class="flex items-start gap-3 text-sm text-black">
              <input
                :id="ids.privacy"
                v-model="privacy"
                type="checkbox"
                name="privacy"
                required
                :disabled="isSubmitting"
                :aria-invalid="privacyError ? 'true' : undefined"
                :aria-describedby="privacyError ? ids.privacyError : undefined"
                class="mt-0.5 h-4 w-4 shrink-0 accent-primary disabled:cursor-wait"
                @change="onPrivacyChange"
              >
              <label :for="ids.privacy">
                {{ labels.privacyBefore }}<a
                  v-if="privacyHref"
                  :href="privacyHref"
                  :target="privacyTarget"
                  :rel="privacyRel"
                  class="text-primary underline"
                >{{ labels.privacyLink }}</a><template v-else>{{ labels.privacyLink }}</template>{{ labels.privacyAfter }}
                <span aria-hidden="true">*</span>
              </label>
            </div>
            <p v-if="privacyError" :id="ids.privacyError" class="mt-1 mb-0 text-sm text-red-700">
              {{ labels.errors[privacyError] }}
            </p>
          </div>

          <div>
            <UButton
              type="submit"
              color="primary"
              variant="solid"
              size="md"
              :loading="isSubmitting"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? labels.sending : submitLabel }}
            </UButton>
          </div>
        </form>
      </div>
    </div>
  </UContainer>
</template>
