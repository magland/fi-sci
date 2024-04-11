import { FunctionComponent } from "react"
import Markdown from "../../Markdown/Markdown"

type QueryHintsViewProps = {
    //
}

const QueryHintsView: FunctionComponent<QueryHintsViewProps> = () => {
    return (
        <div>
            <Markdown source={md} />
        </div>
    )
}

const md = `
# Query hints

Queries use [jsonpath](https://goessner.net/articles/JsonPath/) syntax.

## All neurodata types
\`\`\`
$..attrs.neurodata_type
\`\`\`

## All neurodata types in acquisition
\`\`\`
$.acquisition..attrs.neurodata_type
\`\`\`

## All compressors

\`\`\`
$.._zarray.compressor
\`\`\`

## All descriptions

\`\`\`
$..attrs.description
\`\`\`

## The shape of all ElectricalSeries with more than 1000 timepoints

\`\`\`
$..[?(@.attrs.neurodata_type=='ElectricalSeries' && @.data._zarray.shape[0]>1000)].data._zarray.shape
\`\`\`
`

export default QueryHintsView
