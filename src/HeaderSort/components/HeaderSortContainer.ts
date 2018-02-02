import { Component, ReactElement, createElement } from "react";
import * as classNames from "classnames";
import * as dojoConnect from "dojo/_base/connect";
import * as dojoTopic from "dojo/topic";

import { Alert } from "../../Shared/components/Alert";
import { DataSourceHelper } from "../../Shared/DataSourceHelper/DataSourceHelper";
import { ListView, SharedUtils, WrapperProps } from "../../Shared/SharedUtils";

import { HeaderSort, HeaderSortProps, SortOrder } from "./HeaderSort";

import "../ui/HeaderSort.scss";

export interface ContainerProps extends WrapperProps {
    entity: string;
    caption: string;
    initialSorted: boolean;
    sortAttribute: string;
    sortOrder: "asc" | "desc";
}

export interface ContainerState {
    alertMessage?: string;
    listViewAvailable: boolean;
    publishedSortAttribute?: string;
    publishedSortOrder?: SortOrder;
    publishedSortWidgetFriendlyId?: string;
    targetListView?: ListView;
}

export default class HeaderSortContainer extends Component<ContainerProps, ContainerState> {
    private navigationHandler: object;
    private dataSourceHelper: DataSourceHelper;
    private widgetDOM: HTMLElement;

    constructor(props: ContainerProps) {
        super(props);

        this.state = { listViewAvailable: false };

        this.updateSort = this.updateSort.bind(this);
        this.navigationHandler = dojoConnect.connect(props.mxform, "onNavigation", this, this.connectToListView.bind(this));
        this.subScribeToWidgetChanges = this.subScribeToWidgetChanges.bind(this);
        this.publishWidgetChanges = this.publishWidgetChanges.bind(this);
    }

    render() {
        return createElement("div", {
                className: classNames("widget-header-sort", this.props.class),
                ref: (widgetDOM) => this.widgetDOM = widgetDOM,
                style: SharedUtils.parseStyle(this.props.style)
            },
            createElement(Alert, {
                bootstrapStyle: "danger",
                className: "widget-header-sort-alert",
                message: this.state.alertMessage
            }),
            this.renderSort()
        );
    }

    componentDidUpdate(_prevProps: ContainerProps, prevState: ContainerState) {
        if (this.state.listViewAvailable && !prevState.listViewAvailable && this.props.initialSorted) {
            this.updateSort(this.props.sortAttribute, this.props.sortOrder);
        }
    }

    componentWillUnmount() {
        dojoConnect.disconnect(this.navigationHandler);
    }

    private renderSort(): ReactElement<HeaderSortProps> | null {
        if (!this.state.alertMessage) {
            return createElement(HeaderSort, {
                caption: this.props.caption,
                friendlyId: this.props.friendlyId,
                initialSorted: this.props.initialSorted,
                onClickAction: this.updateSort,
                publishedSortAttribute: this.state.publishedSortAttribute,
                publishedSortOrder: this.state.publishedSortOrder,
                publishedSortWidgetFriendlyId: this.state.publishedSortWidgetFriendlyId,
                sortAttribute: this.props.sortAttribute,
                sortOrder: this.initialSortOrder(this.props.initialSorted, this.props.sortOrder)
            });
        }

        return null;
    }

    private connectToListView() {
        let errorMessage = "";

        try {
            this.dataSourceHelper = DataSourceHelper.getInstance(this.widgetDOM.parentElement, this.props.entity);
        } catch (error) {
            errorMessage = error.message;
        }

        const targetListView = this.dataSourceHelper.getListView();
        this.subScribeToWidgetChanges(targetListView);

        const validationMessage = SharedUtils.validateCompatibility({
            friendlyId: this.props.friendlyId,
            listViewEntity: this.props.entity,
            targetListView
        });

        this.setState({
            alertMessage: validationMessage || errorMessage,
            listViewAvailable: !!targetListView,
            targetListView
        });
    }

    private updateSort(attribute: string, order: string) {
        const { targetListView } = this.state;

        if (targetListView && this.dataSourceHelper) {
            this.dataSourceHelper.setSorting(this.props.friendlyId, [ attribute, order ]);
            this.publishWidgetChanges(attribute, order);
        }
    }

    private subScribeToWidgetChanges(targetListView: ListView) {
        dojoTopic.subscribe(targetListView.friendlyId, (message: string[]) => {
            this.setState({
                publishedSortAttribute: message[0],
                publishedSortOrder: message[1] as SortOrder,
                publishedSortWidgetFriendlyId: message[2]
            });
        });
    }

    private publishWidgetChanges(attribute: string, order: string) {
        if (this.state.targetListView) {
            dojoTopic.publish(this.state.targetListView.friendlyId, [ attribute, order, this.props.friendlyId ]);
        }
    }

    private initialSortOrder(initialSorted: boolean, sortOrder: SortOrder): SortOrder {
        if (initialSorted) {
            return sortOrder;
        }

        return "";
    }
}
