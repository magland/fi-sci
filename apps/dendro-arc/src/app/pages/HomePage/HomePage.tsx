import { Hyperlink } from "@fi-sci/misc";
import { FunctionComponent } from "react";
import useRoute from "../../useRoute";

type Props = {
    width: number
    height: number
}

const HomePage: FunctionComponent<Props> = ({width, height}) => {
    const {setRoute} = useRoute()
    return (
        <div style={{padding: 20}}>
            <h2>Welcome to dendro-arc</h2>
            <hr />
            <p>
                <Hyperlink onClick={() => {
                    setRoute({page: 'projects'})
                }}>View projects</Hyperlink>
            </p>
        </div>
    )
}

export default HomePage