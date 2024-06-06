import { FunctionComponent, useCallback, useMemo } from "react"
import useRoute from "../../useRoute"
import DandisetView from "./DandisetViewFromDendro/DandisetView"
import { DandiAssetContext } from "../NwbPage/DandiAssetContext"
import { SetupContextAnnotationsProvider } from "../NwbPage/NeurosiftAnnotations/useContextAnnotations"

type DandisetPageProps = {
    width: number
    height: number
}

const DandisetPage: FunctionComponent<DandisetPageProps> = ({width, height}) => {
    const {route, setRoute} = useRoute()
    if (route.page !== 'dandiset') throw Error('Unexpected route for DandisetPage: ' + route.page)
    const handleOpenAssets = useCallback((assetUrls: string[], assetPaths: string[]) => {
        if (assetUrls.length > 5) {
            alert(`Cannot open more than 5 assets at once. You tried to open ${assetUrls.length}.`)
            return
        }
        setRoute({
            page: 'nwb',
            dandisetId: route.dandisetId,
            dandisetVersion: route.dandisetVersion,
            url: assetUrls,
            storageType: assetPaths.map(p => {
                if (p.endsWith('.json')) return 'lindi'
                else return 'h5'
            })
        })
    }, [route, setRoute])
    const dandiAssetContextValue = useMemo(() => ({
        dandisetId: route.dandisetId,
        dandisetVersion: route.dandisetVersion || '',
        assetUrl: ''
    }), [route.dandisetId, route.dandisetVersion])
    return (
        <DandiAssetContext.Provider value={dandiAssetContextValue}>
            <SetupContextAnnotationsProvider>
                <DandisetView
                    width={width}
                    height={height}
                    dandisetId={route.dandisetId}
                    dandisetVersion={route.dandisetVersion}
                    useStaging={!!route.staging}
                    onOpenAssets={handleOpenAssets}
                />
            </SetupContextAnnotationsProvider>
        </DandiAssetContext.Provider>
    )

}

// type DandisetInfoTableProps = {
//     dandisetId: string
//     dandisetVersion: string
//     dandisetInfo?: DandisetInfo
// }

// const DandisetInfoTable: FunctionComponent<DandisetInfoTableProps> = ({dandisetInfo, dandisetId, dandisetVersion}) => {
//     return (
//         <div>
//             {dandisetId && (
//                 <p>
//                     DANDISET:&nbsp;
//                     <Hyperlink
//                         href={`https://gui.dandiarchive.org/#/dandiset/${dandisetId}/${dandisetVersion}`}
//                         target="_blank"
//                     >
//                         {dandisetId} {dandisetVersion}
//                     </Hyperlink>&nbsp;
//                 </p>
//             )}
//             {dandisetInfo && (
//                 <p>
//                     {dandisetInfo.name}
//                 </p>
//             )}
//             <hr />
//         </div>
//     )
// }

export default DandisetPage