/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { PermissionsBits, PermissionStore } from "@webpack/common";
import { Channel } from "discord-types/general";

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

export default definePlugin({
    name: "ShowServerSettings",
    description: "Allows you to view the settings of any server.",
    authors: [Devs.Cootshk],
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
                match: /\}isRoleHigher\(((\i,)*\i?)\)\{(.*?)}(\i)\(/,
                // replace: "}isRoleHigher($1){$3}$4("
                replace: "}isRoleHigher($1){let args=[$1]; if (this.can($self.PermissionsBits.MANAGE_ROLES,args[0])) { return false; };$3}$4(",
                // replace: (args, _, code, nextfunc) => `}isRoleHigher(${args}){let args=[${args}]; if (can(PermissionsBits.MANAGE_ROLES,args[0])) { return false; };${code}}${nextfunc}(`,
                // replace: (args, _, code, nextfunc) => `}isRoleHigher(${args}){ if (isRoleHigher(${args}) { return false; };${code}}${nextfunc}(`,
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
        console.log(`Args passed to can(${name}):`, args);
        const check = permissionCheck(args[0], args[1], args.slice(2));
        console.log("Check: ", check);
        // breakpoint; // Uncomment this line to pause execution in a debugger
        if (!args.includes(undefined)) {
            throw new Error("This is a test error to see if the plugin is working.");
        }
        return check;
    },
    // Expose these to the patches
    PermissionStore: PermissionStore,
    PermissionsBits: PermissionsBits

});
const MANAGE_PERMS = [
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
function permissionCheck(permissionBits: bigint, object: Channel, ..._) {
    // Check for the permission bits
    const max_bit = Math.ceil(Math.log2(Number(permissionBits)));
    const permission_bits: bigint[] = []; // list of permissions found in PermissionsBits

    for (let i = 0; i <= max_bit; i++) {
        if (permissionBits & (1n << BigInt(i))) {
            permission_bits.push(1n << BigInt(i));
        }
    }
    console.log("Permission bits found:", permission_bits);

    console.log(`Checking permissions: ${permissionBits} on object:`, object);
    for (const [name, bits] of Object.entries(PermissionsBits)) {
        if (permission_bits.includes(bits)) {
            console.log(`Permission ${name} (${bits}) is being checked.`);
            if (name.includes("MANAGE") || name === "ADMINISTRATOR") { return true; }
        }
    }
    return false;
}
