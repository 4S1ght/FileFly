<script lang="ts">

    // Imports ================================================================

    import type { HTMLInputTypeAttribute } from "svelte/elements"
    import { createEventDispatcher, onDestroy, onMount } from "svelte"

    // Exports ================================================================

    export let placeholder: string = ""
    export let type: HTMLInputTypeAttribute
    export let input: HTMLInputElement
    export let value: string

    // State ==================================================================

    let _active = value.length > 0

    // Code ===================================================================

    const dispatch = createEventDispatcher()

    function focus() {
        input.focus()
        _active = true
    }

    function blur(e: FocusEvent) {
        _active = input.value !== ''
    }

    function onEnter(e: KeyboardEvent) {
        if (e.code === 'Enter' && value.length > 0) {
            e.preventDefault()
            dispatch('enter', {})
        }
    }

    onMount(() => {
        input.type = type
        window.addEventListener('blur', blur)
    })
    onDestroy(() => {
        window.removeEventListener('blur', blur)
    })

</script> 

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="input-field" on:click={focus} data-active={_active}>
    <p class="placeholder">{placeholder}</p>
    <input 
        bind:this={input} 
        bind:value={value} 
        on:blur={blur}
        on:keypress={onEnter}
        on:focus={focus}
    >
</div>

<style lang="scss">

    .input-field {
        border: solid 1px var(--l1-outline);
        border-radius: 10px;
        position: relative;
        padding: 1.6rem 1.2rem;
        cursor: text;
        margin-bottom: 1rem;

        .placeholder {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            margin: 0;
            pointer-events: none;
            user-select: none;
            color: var(--l1-text-light);
            transition: transform 0.15s;
        }
        &[data-active="true"] > .placeholder {
            transform: scale(0.8) translateY(-120%) translateX(-10%);
        }

        input {
            position: absolute;
            width: calc(100% - 3rem);
            top: 50%;
            transform: translateY(-10%);
            background: none;
            border: none;
            outline: none;
            user-select: all;
        }

    }

</style>