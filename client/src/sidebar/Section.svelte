<script lang="ts">
    

    // Imports ================================================================

    import { onMount, afterUpdate, beforeUpdate } from "svelte"

    import Timing from "../core/lib/Timing"

    // State ==================================================================

    export let name: string
    export let iconStyle: 'fa' | 'fas' | 'far' | 'fab' = 'fa'
    export let icon: string

    export let open: boolean = false
    export let onToggle: (open: boolean) => any = () => {}

    let _open = open

    // Interactions ===========================================================

    const toggleTime = 300

    let section: HTMLDivElement
    let header: HTMLDivElement
    let content: HTMLDivElement

    const applyToggleStyling = () => {

        const headerHeight = getComputedStyle(header).height
        const headerPT = getComputedStyle(header).paddingTop
        const headerPB = getComputedStyle(header).paddingBottom
        const hs = `${headerHeight} + ${headerPT} + ${headerPB}`

        const contentHeight = getComputedStyle(content).height
        const contentPT = getComputedStyle(content).paddingTop
        const contentPB = getComputedStyle(content).paddingBottom
        const contentMT = getComputedStyle(content).marginTop
        const contentMB = getComputedStyle(content).marginBottom
        const cs = `${contentHeight} + ${contentPT} + ${contentPB} + ${contentMT} + ${contentMB}`

        section.style.maxHeight = _open
            ? `calc(${hs} + ${cs})`
            : `calc(${hs})`

    }

    const toggle = Timing.throttle(toggleTime, () => {
        _open = !_open
        onToggle(_open)
        applyToggleStyling()
    })

    afterUpdate(() => Timing.immediate(applyToggleStyling))
    onMount(() => Timing.immediate(applyToggleStyling))

</script>

<div class="section stagger" data-open={_open} bind:this={section}>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="header" on:click={toggle} bind:this={header}>
        <div class="icon">
            <div class="active-icon">
                <i class="fa-solid fa-chevron-right"></i>
            </div>
            <div class="resting-icon">
                <i class="{iconStyle} {icon}"></i>
            </div>
        </div>
        <p class="name">{name}</p>
        <div class="line"></div>
    </div>

    <div class="content" bind:this={content}>
        <slot/>
    </div>

</div>

<style lang="scss">

    .section {
        width: 100%;
        gap: 0.7rem;
        margin: 1rem 0 0.5rem 0;
        max-height: 39px;
        transition: max-height 0.3s;
        overflow: hidden;

        &:first-child {
            margin-top: 0.8rem;
        }

        .header {
            width: calc(100% - 1rem);
            padding: 0.5rem 0.5rem;
            display: grid;
            grid-template-columns: 1rem min-content 1fr;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            border-radius: 0.8rem;
        }

        .icon {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative; 
            > div {
                position: absolute;
            }
            :global(svg) {
                transition: transform 0.3s;
            }
            :global(svg path) { 
                color: var(--l0-accent); 
            }
            .active-icon {
                transition: transform 0.3s, opacity 0.3s;
                transform: translateY(70%);
            }
            .resting-icon {
                transition: transform 0.3s, opacity 0.3s;
                transform: translateY(0%);
            }

        }
    
        .name {
            margin: 0;
            color: var(--l0-accent);
        }

        .line {
            width: 100%;
            height: 1px;
            background-color: var(--l0-section);
        }

        .content {
            padding-top: 0.4rem;
            & > :global(*:first-child) {
                margin-top: 0 !important;
            }
        }

        // State ==========================================

        .icon > .active-icon {
            opacity: 0;
        }
        .header:hover {
            background-color: var(--l1-bg);
            // Icon swap
            .icon .active-icon { opacity: 1; transform: translateY(0%); }
            .icon .resting-icon { opacity: 0; transform: translateY(-70%); }
            // Color swap
            .icon :global(svg path) { color: var(--l1-fg-dim); }
            .name { color: var(--l1-fg-dim); }
            .line { opacity: 0 }
        }
        &[data-open="true"] .icon > .active-icon :global(svg) {
            transform: rotate(90deg) !important;
        }

    }

</style>