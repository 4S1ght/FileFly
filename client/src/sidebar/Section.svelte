<script lang="ts">

    export let name: string
    export let closed: boolean = false

    function toggle() {
        closed = !closed
    }

</script>

<div class="section stagger" data-closed={closed}>
    <p>{name}</p>
    <span></span>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="icon-wrap" on:click={toggle}>
        <i class="fa-solid fa-caret-up icon"></i>
    </div>
    <div class="section-content">
        <slot/>
    </div>
</div>

<style lang="scss">

    .section {
        width: 100%;
        display: grid;
        grid-template-columns: min-content 1fr min-content;
        align-items: center;
        gap: 0.7rem;
        margin: 1.5rem 0 0.9rem 0;

        .section-content {
            width: 100%;
        }
        &[data-closed="true"] .section-content {
            display: none;
        }

        .icon-wrap {
            margin: 0;
            padding: 0.1rem 0.3rem;
            cursor: pointer;
            :global(path) {
                color: var(--l0-accent);
            }
        }
        &[data-closed="true"] .icon-wrap {
            transform: rotate(180deg);
        }
    }

    p {
        font-size: 0.8rem;
        color: var(--l0-accent);
        position: relative;
        display: block;
        width: 100%;
        margin: 0;
    }

    span {
        height: 1px;
        width: 100%;
        background-color: var(--l0-section);
    }


</style>