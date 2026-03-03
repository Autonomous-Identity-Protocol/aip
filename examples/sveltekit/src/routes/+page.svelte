<script>
  /** @type {import('./$types').PageData} */
  export let data;
</script>

<h1>AIP SvelteKit Example</h1>

{#if data.identity}
  <p>Authenticated as: <strong>{data.identity.entityId}</strong></p>
  <p>Owner: {data.identity.ownerEmail}</p>
{:else}
  <p>Not authenticated. Send a request with <code>Authorization: Bearer &lt;token&gt;</code></p>
{/if}
