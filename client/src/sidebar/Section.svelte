<script lang="ts">

    // Imports ================================================================

    import Timing from "../core/lib/Timing"
    import { g } from "gilded"

    // State ==================================================================

    export let name: string
    export let iconStyle: 'fa' | 'fas' | 'far' | 'fab' = 'fa'
    export let icon: string

    export let closed: boolean = false
    export let onToggle: (closed: boolean) => any = () => {}

    let _closed = closed

    // Interactions ===========================================================

    const toggleTime = 300

    let section: HTMLDivElement
    let header: HTMLDivElement
    let content: HTMLDivElement

    const toggle = Timing.throttle(toggleTime, () => {

        _closed = !_closed
        onToggle(_closed)

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

        console.log(hs, '|||', cs)

        section.style.maxHeight = _closed
            ? `calc(${hs})`
            : `calc(${hs} + ${cs})`

    })

</script>

<div class="section stagger" data-closed={_closed} bind:this={section}>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="header" on:click={toggle} bind:this={header}>
        <div class="icon">
            <i class="active-icon fa-solid fa-chevron-right"></i>
            <i class="resting-icon {iconStyle} {icon}"></i>
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
            :global(svg path) { color: var(--l0-accent); }
            .active-icon { transition: transform 0.2s; }
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
            padding: 0.5rem 0.5rem 0 0.5rem;
            & > :global(*:first-child) {
                margin-top: 0 !important;
            }
        }

        // State ==========================================

        .icon > .active-icon {
            display: none;
        }
        &:hover {
            // Icon swap
            .icon .active-icon { display: initial; }
            .icon .resting-icon { display: none; }
            // Color swap
            .header { background-color: var(--l0-section); }
            .icon :global(svg path) { color: var(--l1-fg-dim); }
            .name { color: var(--l1-fg-dim); }
            .line { opacity: 0 }
        }
        &[data-closed="false"] .icon > .active-icon {
            transform: rotate(90deg);
        }

    }

</style>