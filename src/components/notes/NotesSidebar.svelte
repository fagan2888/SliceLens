<script>
  import Exporter from './Exporter.svelte';
  import Importer from './Importer.svelte';
  import Viewer from './Viewer.svelte';

  let notes = [];
  notes = [{title: 'Note 1'}, {title: 'Note 2'}, {title: 'Note 3'}];
  let selected = null;
</script>

<div id="notes">
  <h2>Notes</h2>
  <div id="import-export">
    <Importer on:upload={e => notes = e.detail}/>
    <Exporter {notes}/>
  </div>

  <p class="control-label">Recorded</p>
  <div id="list">
    {#each notes as note, i}
      <div on:click={() => selected = note}>
        {note.title}
      </div>
    {/each}
    {#if notes.length === 0}
        No notes.
    {/if}
  </div>

  <Viewer note={selected} on:close={() => selected = null}/>

</div>

<style>
  #notes {
    flex: 0 0 300px;
    background-color: #E5E5E5;
    padding: 5px 15px;

    max-width: 300px;
    display: flex;
    flex-direction: column;
  }

  #import-export {
    margin-top: 16px;
  }

  #list {
    border-radius: 5px;
    padding: 5px;
    background: white;
    font-size: 14px;
    line-height: 1.25;
  }

  #list div {
    cursor: pointer;
  }

  #list div:hover {
    font-weight: bold;
  }
</style>