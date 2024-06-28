<script lang="ts">

    // State ==================================================================

    export let checked: boolean = false
    export let level: string = 'l1'

</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="checkbox-wrapper" data-checked={checked} style="--border: var(--{level}-section);">
    <input type="checkbox" bind:checked={checked}>
    <i class="checkmark fa-solid fa-check"></i>
</div>

<style lang="scss">

    .checkbox-wrapper {
        height: 1.3rem;
        width: 1.3rem;
        border: solid 1px var(--border);
        border-radius: 0.3rem;
        position: relative;
        cursor: pointer;
        display: inline-block;

        &:focus-within {
            --border: var(--theme-1) !important;
        }

        input {
            height: 100%;
            width: 100%;
            margin: 0;
            border: none;
            outline: none;
            position: absolute;
            opacity: 0;
            cursor: pointer;
        }

        .checkmark {
            font-size: 1.2rem;
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            transition: opacity 0.1s;
            pointer-events: none;
            opacity: 0;
        }

        &[data-checked="true"] {
            .checkmark {
                opacity: 1;
            }
        }
    }

</style>
