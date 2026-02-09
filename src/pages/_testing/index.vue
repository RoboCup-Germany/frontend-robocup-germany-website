<script setup lang="ts">
import T3CeRcgHeader from "~/components/global/T3CeRcgHeader.vue";

definePageMeta({
  layout: 'test'
});
</script>

<template>

  <div class="container mx-auto mt-10">
    <div class="mb-8">
      <div class="border ">
        <div class="text-muted">Typo3 Test-Compontents mit Dummy Inhalten:</div>
        <T3CeRcgHeader header="Test Header" header_layout="2"/>
      </div>

<!-- Base-Elements -->
      <h1><b>Headline 01_bold</b></h1>
      <h1>Headline 01</h1>
      <h2><b>Headline 02_bold</b></h2>
      <h2>Headline 02</h2>
      <h3><b>Headline 03_bold</b></h3>
      <h3>Headline 03</h3>
      <h4><b>Headline 04_bold</b></h4>
      <h4>Headline 04</h4>
      <h5>Headline 05</h5>
      <h6>Headline 06</h6>

      <p class="text-lg">Copy01  Lorem ipsum dolor sit amet, consectetuer adipiscing ...</p>
      <p>Copy02  Lorem ipsum dolor sit amet, consectetuer adipiscing ...</p>
      <p class="text-sm">Copy03 Lorem ipsum dolor sit amet, consectetuer adipiscing ...</p>
      <p class="text-xl">Copy04 Lorem ipsum dolor sit amet, consectetuer adipiscing ...</p>
      <ul>
        <li>Aufzählungen unordered Lorem ipsum dolor sit</li>
        <li>Aufzählungen unordered Lorem ipsum dolor sit</li>
      </ul>
      <ol>
        <li>Aufzählungen ordered Lorem ipsum dolor sit</li>
        <li>Aufzählungen ordered Lorem ipsum dolor sit</li>
      </ol>

      <span data-testid="status">READY</span>
    </div>

    <div class="grid grid-cols-1 gap-4 mb-3">
      <div class="mb-3">
        <UButton color="primary" variant="solid">say hello</UButton>
        <UButton color="junior" variant="solid">say hello</UButton>
        <UButton color="major" variant="solid">say hello</UButton>
      </div>
      <div class="mb-3">
        <UButton color="primary" variant="solid" size="lg">Button lg</UButton>
        <UButton color="junior" variant="solid" size="lg">say hello</UButton>
        <UButton color="major" variant="solid" size="lg">say hello</UButton>
      </div>
      <div class="mb-3">
        <UButton color="primary" variant="outline">Button outline</UButton>
      </div>
    </div>

  <!-- GRID -->
  <section>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <article class="bg-white rounded-2xl shadow p-1">
        <h3 class="font-medium">Card 1</h3>
        <p class="text-sm ">Kurzer Text.</p>
      </article>
      <article class="bg-white rounded-2xl shadow p-5">
        <h3 class="font-medium">Card 2</h3>
        <p class="text-sm ">Längerer Text, damit die Höhe variiert. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer viverra.</p>
      </article>
      <article class="bg-white rounded-2xl shadow p-5">
        <h3 class="font-medium">Card 3</h3>
        <p class="text-sm ">Noch etwas mehr Inhalt, um Höhenunterschiede zu zeigen. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices.</p>
      </article>
      <article class="bg-white rounded-2xl shadow p-1">
        <h3 class="font-medium">Card 4</h3>
        <p class="text-sm ">Kurzer Text.</p>
      </article>
      <article class="bg-white rounded-2xl shadow p-1">
        <h3 class="font-medium">Card 5</h3>
        <p class="text-sm ">Längerer Text. Curabitur non nulla sit amet nisl tempus convallis quis ac lectus.</p>
      </article>
      <article class="bg-white rounded-2xl shadow p-1">
        <h3 class="font-medium">Card 6</h3>
        <p class="text-sm ">Etwas mehr Inhalt. Aliquam id diam maecenas ultricies mi eget mauris pharetra et.</p>
      </article>
      <article class="bg-white rounded-2xl shadow p-1">
        <h3 class="font-medium">Card 7</h3>
        <p class="text-sm ">Kurzer Text.</p>
      </article>
      <article class="bg-white rounded-2xl shadow p-1">
        <h3 class="font-medium">Card 8</h3>
        <p class="text-sm ">Sehr sehr sehr langer Text, damit man das Umbruchverhalten sieht. Pellentesque in ipsum id orci porta dapibus.
          Donec sollicitudin molestie malesuada. Cras ultricies ligula sed magna dictum porta.</p>
      </article>
      <article class="bg-white rounded-2xl shadow p-1">
        <h3 class="font-medium">Card 9</h3>
        <p class="text-sm ">Kurzer Text.</p>
      </article>
    </div>
  </section>

  </div>

</template>

<style scoped>

</style>