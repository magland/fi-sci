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

## Neurodata types
- All neurodata types: \`$..attrs.neurodata_type\`
- All neurodata types in acquisition: \`$.acquisition..attrs.neurodata_type\`

## Compression
- All of the compressors of arrays: \`$.._zarray.compressor\`

## Descriptions
- All description attributes: \`$..attrs.description\`
`

export default QueryHintsView
