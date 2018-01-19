import { ListView as SharedListView } from "../Shared/SharedUtils";

export interface HeaderSortListView extends SharedListView {
    friendlyId: string;
}

interface WrapperProps {
    class: string;
    style: string;
    friendlyId: string;
    mxform: mxui.lib.form._FormBase;
    mxObject: mendix.lib.MxObject;
}
