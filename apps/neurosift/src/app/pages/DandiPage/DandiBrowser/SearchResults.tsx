/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useCallback } from "react"
import { Hyperlink } from "@fi-sci/misc";
import { Splitter } from "@fi-sci/splitter";
import formatByteCount from "./formatByteCount";
import { DandisetSearchResultItem } from "./types"
import DandisetView from "../../DandisetPage/DandisetViewFromDendro/DandisetView";
import useRoute from "../../../useRoute";

const applicationBarColorDarkened = '#546' // from dendro

type SearchResultsProps = {
    width: number
    height: number
    searchResults: DandisetSearchResultItem[]
    useStaging?: boolean
}

const defaultMinLeft = 200
const defaultMaxLeft = 500

const SearchResults: FunctionComponent<SearchResultsProps> = ({width, height, searchResults, useStaging}) => {
    // const [selectedDandisetItem, setSelectedDandisetItem] = useState<DandisetSearchResultItem | null>(null)
    const {route, setRoute} = useRoute()
    const dandisetId = route.page === 'dandiset' ? route.dandisetId : undefined
    // useEffect(() => {
    //     // reset the selected item when the useStaging changes
    //     // setSelectedDandisetItem(null)
    //     setRoute({page: 'home'})
    // }, [useStaging, setRoute])
    // const handleImportAssets = useCallback(async (assetItems: AssetsResponseItem[]) => {
    //     if (!selectedDandisetItem) return
    //     const {identifier, most_recent_published_version, draft_version} = selectedDandisetItem
    //     const dandisetId = identifier
    //     const dandisetVersion = most_recent_published_version?.version || draft_version?.version || ''
    //     const items = assetItems.map(assetItem => ({dandisetId, dandisetVersion, assetItem}))
    //     await onImportItems(items)
    // }, [selectedDandisetItem, onImportItems])

    const setSelectedDandisetItem = useCallback((item: DandisetSearchResultItem) => {
        setRoute({page: 'dandiset', dandisetId: item.identifier, staging: (route as any)['staging'] || false})
    }, [setRoute, route])

    return (
        <Splitter
            width={width}
            height={height}
            initialPosition={Math.max(defaultMinLeft, Math.min(defaultMaxLeft, width * 0.25))}
            direction='horizontal'
            hideSecondChild={!dandisetId}
        >
            <SearchResultsLeft
                width={0}
                height={0}
                searchResults={searchResults}
                setSelectedItem={setSelectedDandisetItem}
                // onImportItems={onImportItems} // not actually needed
                // onClickAsset={onClickAsset} // not actually needed
            />
            <DandisetView
                dandisetId={dandisetId || ''}
                width={0}
                height={0}
                // onClickAsset={(assetItem: AssetsResponseItem) => {onClickAsset(selectedItem?.identifier || '', selectedItem?.most_recent_published_version?.version || 'draft', assetItem)}}
                useStaging={useStaging}
            />
        </Splitter>
    )
}

const SearchResultsLeft: FunctionComponent<SearchResultsProps & {setSelectedItem: (item: DandisetSearchResultItem) => void}> = ({width, height, searchResults, setSelectedItem}) => {
    return (
        <div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
            {
                searchResults.map((result, i) => (
                    <SearchResultItem
                        key={i}
                        result={result}
                        width={width}
                        onClick={() => setSelectedItem(result)}
                    />
                ))
            }
        </div>
    )
}

type SearchResultItemProps = {
    result: DandisetSearchResultItem
    width: number
    onClick: () => void
}

const SearchResultItem: FunctionComponent<SearchResultItemProps> = ({result, width, onClick}) => {
    const {identifier, created, modified, contact_person, most_recent_published_version, draft_version} = result
    const X = most_recent_published_version || draft_version
    if (!X) return <div>Unexpected error: no version</div>

    return (
        <div style={{padding: 10, borderBottom: 'solid 1px #ccc'}}>
            <div style={{fontSize: 18, fontWeight: 'bold'}}>
                <Hyperlink color={applicationBarColorDarkened} onClick={onClick}>
                    {identifier} ({X.version}): {X.name}
                </Hyperlink>
            </div>
            <div style={{fontSize: 14, color: '#666'}}>Contact: {contact_person}</div>
            <div style={{fontSize: 14, color: '#666'}}>Created {formatTime(created)} | Modified {formatTime(modified)}</div>
            {
                X && (
                    <div style={{fontSize: 14, color: '#666'}}>
                        {X.asset_count} assets, {formatByteCount(X.size)}, status: {X.status}
                    </div>
                )
            }
        </div>
    )
}

export const formatTime = (time: string) => {
    const timestamp = Date.parse(time)
    return new Date(timestamp).toLocaleString()
}

export default SearchResults