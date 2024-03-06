import { Hyperlink } from "@fi-sci/misc";
import { FunctionComponent } from "react";
import { FaGithub } from "react-icons/fa";

type Props = {
    width: number
    height: number
}

const HomePage: FunctionComponent<Props> = ({width, height}) => {
    return (
        <div style={{padding: 20}}>
            <h2>Welcome to Neurosift</h2>
            <p><Hyperlink href="https://github.com/flatironinstitute/neurosift">About this project</Hyperlink></p>
            <p><FaGithub /> Please <Hyperlink href="https://github.com/flatironinstitute/neurosift">star us</Hyperlink> on GitHub.</p>
            <hr />
        </div>
    )
}

export default HomePage