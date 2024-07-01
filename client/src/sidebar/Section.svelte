<script lang="ts">

    export let name: string

</script>

<div class="section">
    <p>{name}</p>
    <span></span>
</div>

<style lang="scss">

    .section {
        width: 100%;
        display: grid;
        grid-template-columns: min-content 1fr;
        align-items: center;
        gap: 0.7rem
    }

    p {
        font-size: 0.8rem;
        color: var(--l0-accent);
        position: relative;
        display: block;
        width: 100%;
    }

    span {
        height: 1px;
        width: 100%;
        background-color: var(--l0-section);
    }

</style>