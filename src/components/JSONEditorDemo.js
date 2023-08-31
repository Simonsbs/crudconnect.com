import React, { useEffect, useRef } from "react";
import JSONEditor from "jsoneditor";

// Removed the unnecessary CSS import
// import 'jsoneditor/dist/jsoneditor.css';

export default function JSONEditorDemo(props) {
  const containerRef = useRef(null);

  useEffect(() => {
    const options = {
      mode: "tree",
      onChangeJSON: props.onChangeJSON,
    };

    const jsoneditor = new JSONEditor(containerRef.current, options);
    jsoneditor.set(props.json);

    // Cleanup on component unmount
    return () => {
      jsoneditor.destroy();
    };
  }, [props.onChangeJSON, props.json]);

  return <div ref={containerRef} />;
}
