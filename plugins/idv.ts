type ApiResponse = {
    result: string;
    note?: string;
};

export type IdvPluginContext = {
    document: {
        documentNode: unknown;
        querySelectorAll(selector: string): ArrayLike<IdvSenderButton>;
    };
    checkIdv(slackId: string): Promise<boolean>;
    MutationObserver: new (callback: () => void) => {
        observe(target: unknown, options: { childList: boolean; subtree: boolean }): void;
    };
};

type IdvSenderButton = {
    getAttribute(name: string): string | null;
    setAttribute(name: string, value: string): void;
    removeAttribute(name: string): void;
    closest(selector: string): IdvSenderButton | null;
};

export type Plugin = {
    name: string;
    start(context: IdvPluginContext): void;
};

export async function isVerif(slackId: string, checkIdv: IdvPluginContext['checkIdv']): Promise<boolean> {
    return checkIdv(slackId);
}

export function createIdvPlugin(): Plugin {
    const results = new Map<string, boolean>();
    const pending = new Map<string, Promise<boolean>>();

    function findSlackId(button: IdvSenderButton): string | null {
        const selectors = [
            '[data-member-id]',
            '[data-user-id]',
            '[data-sender-id]',
        ];

        for (const selector of selectors) {
            const element = button.closest(selector);
            const attribute = selector.slice(6, -1);
            const slackId = element?.getAttribute(attribute);
            if (slackId) return slackId;
        }

        return null;
    }

    function mark(button: IdvSenderButton, unverified: boolean): void {
        if (unverified) {
            button.setAttribute('data-hc-unverified', 'true');
        } else {
            button.removeAttribute('data-hc-unverified');
        }
    }

    return {
        name: 'idv',
        start(context): void {
            const scan = (): void => {
                for (const button of Array.from(context.document.querySelectorAll('.c-message__sender_button'))) {
                    const slackId = findSlackId(button);
                    if (!slackId) continue;

                    const cached = results.get(slackId);
                    if (cached !== undefined) {
                        mark(button, !cached);
                        continue;
                    }

                    let check = pending.get(slackId);
                    if (!check) {
                        check = isVerif(slackId, context.checkIdv);
                        pending.set(slackId, check);
                        void check.then((verified) => {
                            results.set(slackId, verified);
                            pending.delete(slackId);
                            scan();
                        });
                    }
                }
            };

            new context.MutationObserver(scan).observe(context.document.documentNode, {
                childList: true,
                subtree: true,
            });
            scan();
        },
    };
}