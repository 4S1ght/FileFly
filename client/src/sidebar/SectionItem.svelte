<script lang="ts">

    // State ==================================================================

    export let active: boolean = false

</script>

<div class="section-item" data-active={active}>
    <slot/>
</div>

<style lang="scss">

    .section-item {
        width: calc(100% - 1rem);
        padding: 0.5rem;
        border-radius: 0.8rem;
    }

</style>
