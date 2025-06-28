/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { PermissionsBits, PermissionStore } from "@webpack/common";
import { Channel } from "discord-types/general";


const DEBUG_LOGGING = false;

const perms_list = [
    // Show the server settings button
    "canAccessGuildSettings",
    // Show the member safety button (and members page)
    "canAccessMemberSafetyPage",
    // Shows the Mod View context menu item
    "canManageUser",
    // Lets you press View Server as Role
    "canImpersonateRoles",
];
const server_perms_list = [
    "ADMINISTRATOR",
    "MANAGE_CHANNELS",
    "MANAGE_EVENTS",
    "MANAGE_GUILD",
    "MANAGE_GUILD_EXPRESSIONS",
    "MANAGE_MESSAGES",
    "MANAGE_NICKNAMES",
    "MANAGE_ROLES",
    "MANAGE_THREADS",
    "MANAGE_WEBHOOKS",
];
const make_permission_settings = () => {
    const settings = {};
    for (const perm of server_perms_list) {
        // name has to be in camelCase
        settings[perm.toLowerCase().replace(/_(.)/g, letter => letter.toUpperCase())] = {
            type: OptionType.BOOLEAN,
            name: perm,
            description: `Allows you to see ${perm.replace(/MANAGE_/i, "").toLowerCase().replace(/s$/i, "")} related settings.`,
            defaultValue: perm === "MANAGE_ROLES",
            // hidden: false,
            // restartNeeded: false,
            internalName: perm
        };
    }
    return settings;
};
const settings = definePluginSettings({
    permissionTogglesSection: {
        type: OptionType.COMPONENT,
        component: props => {
            return (<div>
                <h1 style={{ color: "var(--header-secondary)" }}>Server Permissions</h1>
                {/* line */}
                <hr />
            </div>);
        },
    },
    test: {
        type: OptionType.BOOLEAN,
        name: "Test",
        description: "Test setting for intellisense.",
        defaultValue: true,
        hidden: true,
        restartNeeded: false,
        internalName: "test_setting",
    },
    ...make_permission_settings(),
    // Permissions
});

export default definePlugin({
    name: "ShowServerSettings",
    description: "Allows you to view the settings of any server.",
    authors: [Devs.Cootshk],
    settings,
    patches: [
        {
            // Theoretically can be replaed with anything in perms_list
            find: "}canAccessGuildSettings(",
            replacement: // [
                /*
                {
                    match: /\}canAccessGuildSettings\(((\i,)*\i+)\){return/,
                    replace: "}canAccessGuildSettings($1){return true||",
                },
                */
                perms_list.map(perm => {
                    console.log(`Patching permission: ${perm}`);
                    return {
                        match: new RegExp(`\\}${perm}\\(((\\i,)*\\i?)\\){return`),
                        replace: `}${perm}($1){return true||`,
                    };
                }),
            // ]
        },
        {
            find: "canAccessGuildSettings(",
            replacement: [
                {
                    // Log the args passed to can()
                    match: /}can\(((\i,)*\i?)\){/,
                    replace: "}can($1){if($self.can('$1',$1)){return true;};",
                }
            ]
        },
        {
            find: "}isRoleHigher(",
            replacement: {
                // yes, this breaks on any if statement.
                // yes, i'm too lazy to fix it.
                match: /\}isRoleHigher\(((\i,)*\i?)\)\{([^}]*)\}(\i)\(/,
                // replace: "}isRoleHigher($1){$3}$4("
                // replace: (args, _, code, nextfunc) => `}isRoleHigher(${args}){let args=[${args}]; if (can(PermissionsBits.MANAGE_ROLES,args[0])) { return false; };${code}}${nextfunc}(`,
                replace: "}isRoleHigher($1) { if (this.can($self.PermissionsBits.MANAGE_ROLES,arguments[0])) {return false;}; $3}$4(",
            }
        },
    ],
    /*
    Types: (as of June 2 2025)
    eA: text channel
    eD: voice channel
    eN: also voice channel?
    c: server
    ev: category
    eC: thread
    eO: announcement channel
    eK: also thread?
    eS: stage channel
    */

    can: (name, ...args: any[]) => {
        if (DEBUG_LOGGING) console.log(`Args passed to can(${name}):`, args);
        const check = permissionCheck(args[0], args[1], args.slice(2));
        if (DEBUG_LOGGING) console.log("Check: ", check);
        // breakpoint; // Uncomment this line to pause execution in a debugger
        if (DEBUG_LOGGING && !args.includes(undefined)) {
            throw new Error("This is a test error to see if the plugin is working.");
        }
        return check;
    },
    // Expose these to the patches
    PermissionStore: PermissionStore,
    PermissionsBits: PermissionsBits

});
// const MANAGE_PERMS = [
//     "ADMINISTRATOR",
//     "MANAGE_CHANNELS",
//     "MANAGE_EVENTS",
//     "MANAGE_GUILD",
//     "MANAGE_GUILD_EXPRESSIONS",
//     "MANAGE_MESSAGES",
//     "MANAGE_NICKNAMES",
//     "MANAGE_ROLES",
//     "MANAGE_THREADS",
//     "MANAGE_WEBHOOKS",
// ];
function permissionCheck(permissionBits: bigint, object: Channel, ..._) {
    // Check for the permission bits
    const max_bit = Math.ceil(Math.log2(Number(permissionBits)));
    const permission_bits: bigint[] = []; // list of permissions found in PermissionsBits

    for (let i = 0n; i <= max_bit; i++) {
        if (permissionBits & (1n << i)) {
            permission_bits.push(1n << i);
        }
    }
    if (DEBUG_LOGGING) console.log("Permission bits found:", permission_bits);

    if (DEBUG_LOGGING) console.log(`Checking permissions: ${permissionBits} on object:`, object);
    for (const [name, bits] of Object.entries(PermissionsBits)) {
        if (permission_bits.includes(bits)) {
            if (DEBUG_LOGGING) console.log(`Permission ${name} (${bits}) is being checked.`);
            if (name.includes("MANAGE") || name === "ADMINISTRATOR") { return true; }
        }
    }
    return false;
}
