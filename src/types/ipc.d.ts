type ChannelPayloadMapping = {
    closeWindow: void;
    minimizeWindow: void;
    maximizeWindow: void;
    openProjectDialog: Promise<{path: string} | {path: null}>
}