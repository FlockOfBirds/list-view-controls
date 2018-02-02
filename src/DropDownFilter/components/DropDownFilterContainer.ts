import { Component, ReactElement, createElement } from "react";
import * as classNames from "classnames";
import * as dojoConnect from "dojo/_base/connect";

import { Alert } from "../../Shared/components/Alert";
import { DataSourceHelper } from "../../Shared/DataSourceHelper/DataSourceHelper";
import { ListView, SharedUtils, WrapperProps } from "../../Shared/SharedUtils";
import { Validate } from "../Validate";

import { DropDownFilter, DropDownFilterProps } from "./DropDownFilter";

import "../ui/DropDownFilter.scss";

export interface ContainerProps extends WrapperProps {
    entity: string;
    filters: FilterProps[];
}

export interface FilterProps {
    caption: string;
    filterBy: filterOptions;
    attribute: string;
    attributeValue: string;
    constraint: string;
    isDefault: boolean;
}

export type filterOptions = "none" | "attribute" | "XPath";

export interface ContainerState {
    alertMessage?: string;
    listViewAvailable: boolean;
    targetListView?: ListView;
    targetNode?: HTMLElement;
}

export default class DropDownFilterContainer extends Component<ContainerProps, ContainerState> {
    private dataSourceHelper: DataSourceHelper;
    private navigationHandler: object;
    private widgetDOM: HTMLElement;

    constructor(props: ContainerProps) {
        super(props);

        this.state = {
            alertMessage: Validate.validateProps(this.props),
            listViewAvailable: false
        };

        this.applyFilter = this.applyFilter.bind(this);
        // Ensures that the listView is connected so the widget doesn't break in mobile due to unpredictable render time
        this.navigationHandler = dojoConnect.connect(props.mxform, "onNavigation", this, this.connectToListView.bind(this));
    }

    render() {
        return createElement("div",
            {
                className: classNames("widget-drop-down-filter", this.props.class),
                ref: (widgetDOM: HTMLElement) => this.widgetDOM = widgetDOM,
                style: SharedUtils.parseStyle(this.props.style)
            },
            this.renderAlert(),
            this.renderDropDownFilter()
        );
    }

    componentDidUpdate(prevProps: ContainerProps, prevState: ContainerState) {
        if (this.state.listViewAvailable
                && (!prevState.listViewAvailable || prevProps.mxObject !== this.props.mxObject)) {
            const selectedFilter = this.props.filters.filter(filter => filter.isDefault)[0] || this.props.filters[0];
            this.applyFilter(selectedFilter);
        }
    }

    componentWillUnmount() {
        dojoConnect.disconnect(this.navigationHandler);
    }

    private renderAlert() {
        return createElement(Alert, {
            bootstrapStyle: "danger",
            className: "widget-drop-down-filter-alert",
            message: this.state.alertMessage
        });
    }

    private renderDropDownFilter(): ReactElement<DropDownFilterProps> {
        if (!this.state.alertMessage) {
            const defaultFilterIndex = this.props.filters.indexOf(this.props.filters.filter(value => value.isDefault)[0]);
            if (this.props.mxObject) {
            this.props.filters.forEach(filter => filter.constraint = filter.constraint.replace(`'[%CurrentObject%]'`,
                    this.props.mxObject.getGuid()
                ));
            }

            return createElement(DropDownFilter, {
                defaultFilterIndex,
                filters: this.props.filters,
                handleChange: this.applyFilter
            });
        }

        return null;
    }

    private applyFilter(selectedFilter: FilterProps) {
        const constraint = this.getConstraint(selectedFilter);
        if (this.dataSourceHelper)
            this.dataSourceHelper.setConstraint(this.props.friendlyId, constraint);
    }

    private getConstraint(selectedFilter: FilterProps) {
        const { targetListView } = this.state;
        if (targetListView && targetListView._datasource) {
            const { attribute, filterBy, constraint, attributeValue } = selectedFilter;
            if (filterBy === "XPath") {
                return constraint;
            } else if (filterBy === "attribute") {
                return `[contains(${attribute},'${attributeValue}')]`;
            } else {
                return "";
            }
        }
    }

    private connectToListView() {
        let errorMessage = "";

        try {
            this.dataSourceHelper = DataSourceHelper.getInstance(this.widgetDOM.parentElement, this.props.entity);
        } catch (error) {
            errorMessage = error.message;
        }
        const targetListView = this.dataSourceHelper.getListView();
        // DataSourceHelper.hideContent(targetListView.domNode);

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
}
