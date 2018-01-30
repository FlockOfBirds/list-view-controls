import { ListView } from "../../Shared/SharedUtils";

export const hideLoadMoreButton = (targetNode?: HTMLElement | null) => {
    if (targetNode) {
        const buttonNode = targetNode.querySelector(".mx-listview-loadMore") as HTMLButtonElement;

        if (buttonNode) {
            buttonNode.classList.add("widget-pagination-hide-load-more");
        }
    }
};

export const showLoadMoreButton = (targetNode?: HTMLElement | null) => {
    if (targetNode) {
        const buttonNode = targetNode.querySelector(".mx-listview-loadMore") as HTMLButtonElement;

        if (buttonNode) {
            buttonNode.classList.remove("widget-pagination-hide-load-more");
        }
    }
};

export const resetListViewStructure = (targetNode: HTMLElement) => {
    const listNode = targetNode.querySelector("ul") as HTMLUListElement;

    listNode.style.removeProperty("height");
    listNode.style.removeProperty("overflow");
};

export const getListNode = (targetNode: HTMLElement): HTMLUListElement => {
    return targetNode.querySelector("ul") as HTMLUListElement;
};

export const setListNodeToEmpty = (listNode: HTMLUListElement) => {
    listNode.innerHTML = "";
};

export const showLoader = (targetListView: ListView) => {
    targetListView.domNode.classList.add("widget-pagination-loading");
};

export const hideLoader = (targetListView: ListView) => {
    targetListView.domNode.classList.remove("widget-pagination-loading");
};
