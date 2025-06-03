/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

function video(url: string, type: string | undefined) {
    if (!type) { return (<source src={url}></source>); }
    return (<source src={url} type={type}></source>);
}

const settings = definePluginSettings({
    videoURL: {
        type: OptionType.STRING,
        description: "The URL to use as the spinner.",
        default: "https://cdn.discordapp.com/emojis/1024751291504791654.gif?size=512",
        restartNeeded: true,
    },
    videoType: {
        type: OptionType.SELECT,
        description: "The type of video to use.",
        default: "video/gif",
        options: [
            { label: "GIF", value: "video/gif" },
            { label: "MP4", value: "video/mp4" },
            { label: "WebM", value: "video/webm" },
        ],
        restartNeeded: true,
    }
});

export default definePlugin({
    name: "Custom Loading Movie",
    description: "Allows you to change the spinning discord logo that appears when Discord is loading.",
    authors: [Devs.Cootshk],
    patches: [ // video id: 7ba7fcf2c4710bb7
        {
            find: "app-spinner",
            replacement: {
                match: /children:\i/,
                replace: "children:$self.video(settings.store.videoURL, settings.store.videoType)",
            }
        }
    ],
    settings
});
