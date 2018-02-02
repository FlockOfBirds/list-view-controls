import { ListView, OfflineConstraint, SharedUtils } from "../SharedUtils";
import "./ui/DataSourceHelper.scss";

interface ConstraintStore {
    constraints: { [widgetId: string]: string | OfflineConstraint; };
    sorting: { [widgetId: string]: string[] };
}

export interface Version {
    major: number;
    minor: number;
    patch: number;
}

interface DataSourceHelperListView extends ListView {
    __customWidgetDataSourceHelper?: DataSourceHelper;
}

export class DataSourceHelper {
    private initialLoad = true;
    private delay = 50;
    private timeoutHandle?: number;
    private store: ConstraintStore = { constraints: {}, sorting: {} };
    private widget: DataSourceHelperListView;
    private updateInProgress = false;
    private requiresUpdate = false;

    constructor(widget: DataSourceHelperListView) {
        this.mendixCompatibilityCheck(widget);
        this.widget = widget;
    }

    static getInstance(widgetParent: HTMLElement, widgetEntity: string) {
        const listViewWidget = SharedUtils.findTargetListView(widgetParent, widgetEntity) as DataSourceHelperListView;

        if (listViewWidget) {
            if (!listViewWidget.__customWidgetDataSourceHelper) {
                listViewWidget.__customWidgetDataSourceHelper = new DataSourceHelper(listViewWidget);
            }
            listViewWidget.__customWidgetDataSourceHelper.initialLoad = true;

            return listViewWidget.__customWidgetDataSourceHelper;
        }

        throw new Error("Missing list view");
    }

    setSorting(widgetId: string, sortConstraint: string[]) {
        this.store.sorting = {} ;
        this.store.sorting[widgetId] = sortConstraint;
        this.registerUpdate();
    }

    setConstraint(widgetId: string, constraint: string | OfflineConstraint) {
        this.store.constraints[widgetId] = constraint as string | OfflineConstraint;
        this.registerUpdate();
    }

    getListView(): ListView {
        return this.widget as ListView;
    }

    private registerUpdate() {
        if (this.timeoutHandle) {
            window.clearTimeout(this.timeoutHandle);
        }
        if (!this.updateInProgress) {
            this.timeoutHandle = window.setTimeout(() => {
                this.updateInProgress = true;
                // TODO Check if there's currently no update happening on the listView coming from another
                // Feature/functionality/widget which does not use DataSourceHelper
                this.iterativeUpdateDataSource();
          }, this.delay);
        } else {
            this.requiresUpdate = true;
        }
    }

    private iterativeUpdateDataSource() {
        this.updateDataSource(() => {
            if (this.requiresUpdate) {
                this.requiresUpdate = false;
                this.iterativeUpdateDataSource();
            } else {
                this.updateInProgress = false;
            }
        });
    }

    private mendixCompatibilityCheck(widget: ListView) {
        if (!(widget._datasource && (widget._datasource._constraints !== undefined) && widget._entity
                && widget.update && widget.datasource.type)) {
            throw new Error("Mendix version is incompatible");
        }
    }

    private updateDataSource(callback: () => void) {
        let constraints: OfflineConstraint[] | string;
        const sorting: string[][] = Object.keys(this.store.sorting)
            .map(key => this.store.sorting[key])
            .filter(sortConstraint => sortConstraint[0] && sortConstraint[1]);

        if (window.mx.isOffline()) {
            constraints = Object.keys(this.store.constraints)
                .map(key => this.store.constraints[key] as OfflineConstraint)
                .filter(mobileConstraint => mobileConstraint.value);
        } else {
            constraints = Object.keys(this.store.constraints)
                .map(key => this.store.constraints[key]).join("");
        }

        this.widget._datasource._constraints = constraints;
        this.widget._datasource._sorting = sorting;

        if (!this.initialLoad) {
            this.showLoader();
        }

        this.widget.update(null, () => {
           this.hideLoader();
           this.initialLoad = false;
           callback();
        });
    }

    private showLoader() {
        this.widget.domNode.classList.add("widget-data-source-helper-loading");
    }

    static hideContent(targetNode?: HTMLElement) {
        if (targetNode) {
            targetNode.classList.add("widget-data-source-helper-initial-loading");
        }
    }

    static showContent(targetNode?: HTMLElement) {
        if (targetNode) {
            targetNode.classList.remove("widget-data-source-helper-initial-loading");
        }
    }

    private hideLoader() {
        this.widget.domNode.classList.remove("widget-data-source-helper-loading");
        DataSourceHelper.showContent(this.widget.domNode);
    }
}
