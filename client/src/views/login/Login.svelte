<script lang="ts">

    // Imports ================================================================

    import Input from "./Input.svelte"
    import Checkbox from "../../components/Checkbox.svelte"

    import { g } from 'gilded'
    import { onMount } from "svelte"

    import uapi from "../../core/UserAPI"

    // State ==================================================================

    let _username: string
    let _password: string

    let usernameInput: HTMLInputElement
    let passwordInput: HTMLInputElement

    // Code ===================================================================

    function focusPwd() {
        passwordInput.click()
    }

    function submit(e: Event) {

    }

</script>

<div class="login">
    <form on:submit={submit}>
        <h1>Welcome to <span>Filefly</span>!</h1>
        <p class="brief">A web file hosting solution for people of all technical level. Log in, or contact the administrator for a password reset.</p>
        <br>
        <Input placeholder="Username" type="text"     bind:value={_username} bind:input={usernameInput} on:enter={focusPwd} />
        <Input placeholder="Password" type="password" bind:value={_password} bind:input={passwordInput} on:enter={submit} />
    
    </form>
</div>

<style lang="scss">

    .login {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: 100%;
        background-color: var(--l0-bg);
        display: flex;
        justify-content: center;
        padding-top: 5rem;
        overflow: auto;

        form {
            max-width: 360px;
        }

        h1 {
            font-weight: 300;
            color: var(--l0-text-bright);
            span {
                background: linear-gradient(132deg, var(--theme-1) 0%, var(--theme-2) 100%);
                background-clip: text;
                color: transparent;
                font-weight: 700;
            }
        }

        p.brief {
            color: var(--l0-fg-dim);
        }


    }

</style>