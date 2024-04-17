import { FunctionComponent, useCallback } from "react"
import useRoute from "../../useRoute"
import DandisetView from "./DandisetViewFromDendro/DandisetView"

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
    return (
        <DandisetView
            width={width}
            height={height}
            dandisetId={route.dandisetId}
            dandisetVersion={route.dandisetVersion}
            useStaging={!!route.staging}
            onOpenAssets={handleOpenAssets}
        />
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