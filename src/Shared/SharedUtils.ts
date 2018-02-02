import * as dijitRegistry from "dijit/registry";

export interface WrapperProps {
    class: string;
    style: string;
    friendlyId: string;
    mxform: mxui.lib.form._FormBase;
    mxObject: mendix.lib.MxObject;
}

export interface ListView extends mxui.widget._WidgetBase {
    _datasource: {
        setOffset: (offSet: number) => void;
        _constraints: OfflineConstraint[] | string;
        _entity: string;
        _pageSize: number;
        _setSize: number;
        _sorting: string[][];
    };
    _entity: string;
    _renderData: () => void;
    _showLoadingIcon: () => void;
    _sourceReload: () => void;
    friendlyId: string;
    datasource: {
        type: "microflow" | "entityPath" | "database" | "xpath";
    };
    update: (obj: mendix.lib.MxObject | null, callback?: () => void) => void;
    sequence: (sequence: string[], callback?: () => void) => void;
}

export interface OfflineConstraint {
    attribute: string;
    operator: string;
    value: string;
    path?: string;
}

export class SharedUtils {
    static parseStyle(style = ""): {[key: string]: string} {
        try {
            return style.split(";").reduce<{[key: string]: string}>((styleObject, line) => {
                const pair = line.split(":");
                if (pair.length === 2) {
                    const name = pair[0].trim().replace(/(-.)/g, match => match[1].toUpperCase());
                    styleObject[name] = pair[1].trim();
                }
                return styleObject;
            }, {});
        } catch (error) {
            // tslint:disable-next-line no-console
            window.console.log("Failed to parse style", style, error);
        }

        return {};
    }

    static validateCompatibility(props: {friendlyId: string, listViewEntity?: string, targetListView?: ListView; }): string {
        const { targetListView } = props;
        const type = targetListView && targetListView.datasource && targetListView.datasource.type;
        const widgetName = props.friendlyId;

        if (!targetListView) {
            return `${widgetName}: unable to find a list view to connect`;
        }
        if (type && type !== "database" && type !== "xpath") {
            return `${widgetName}: widget is only compatible with list view data source type 'Database' and 'XPath'`;
        }
        if (!(targetListView && targetListView._datasource && targetListView._entity && targetListView.update)) {
            return `${widgetName}: this mendix version is incompatible`;
        }
        if (targetListView._entity && props.listViewEntity !== targetListView._entity) {
            return `${widgetName}: supplied entity "${props.listViewEntity}" does not belong to list view data source`;
        }

        return "";
    }

    static findTargetNode(filterNode: HTMLElement): HTMLElement | null {
        let targetNode: HTMLElement | null = null ;

        while (!targetNode && filterNode) {
            targetNode = filterNode.querySelectorAll(`.mx-listview`)[0] as HTMLElement;
            if (targetNode || filterNode.isEqualNode(document) || !filterNode.classList || filterNode.classList.contains("mx-incubator")
                    || filterNode.classList.contains("mx-offscreen")) {
                break;
            }
            filterNode = filterNode.parentNode as HTMLElement;
        }

        return targetNode;
    }

    static findTargetListView(filterNode: HTMLElement, listViewEntity?: string): ListView | undefined {
        let targetListView: ListView | undefined;

        while (filterNode) {
            const targetNodes = filterNode.querySelectorAll(`.mx-listview`);

            if (filterNode.isEqualNode(document) || !filterNode.classList || filterNode.classList.contains("mx-incubator")
                || filterNode.classList.contains("mx-offscreen")) {
                break;
            }

            for (let count = 0; count < targetNodes.length; count++) { //tslint:disable-line
                targetListView = dijitRegistry.byNode(targetNodes.item(count) as HTMLElement);

                if (targetListView && !listViewEntity) { // returns the first found list view
                    return targetListView;
                }

                if (targetListView && (targetListView._entity === listViewEntity)) {
                    return targetListView;
                }
            }
            filterNode = filterNode.parentNode as HTMLElement;
        }

        return targetListView;
    }
}
