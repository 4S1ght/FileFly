<script lang="ts">

    // Imports ================================================================

    import { onMount } from "svelte"

    // State ==================================================================

    export let checked: boolean = false
    export let level: string = 'l1'

    // Code ===================================================================

    function update(e: MouseEvent) {
        checked = !checked
    }

</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="checkbox-wrapper" on:click={update} data-checked={checked} style="border: solid 1px var(--{level}-outline);">
    <i class="checkbox fa-solid fa-check"></i>
</div>

<style lang="scss">

    .checkbox-wrapper {
        height: 1.3rem;
        width: 1.3rem;
        border-radius: 0.3rem;
        position: relative;
        cursor: pointer;

        .checkbox {
            opacity: 0;
            font-size: 1.2rem;
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            transition: opacity 0.15s;
        }

        &[data-checked="true"] {
            .checkbox {
                opacity: 1;
            }
        }
    }

</style>
