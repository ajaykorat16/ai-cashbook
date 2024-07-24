import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import ClientListLayout from './ClientListLayout';

const UploadCsv = () => {
    const [files, setFiles] = useState([]);

    const onDrop = useCallback((acceptedFiles) => {
        const csvFiles = acceptedFiles.filter(file => file.name.endsWith('.csv'));
        setFiles(csvFiles);
        console.log('Accepted CSV files:', csvFiles);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: '.csv',
        multiple: true
    });

    useEffect(() => {
        console.log('Files updated:', files);
    }, [files]);

    return (
        <>
            <ClientListLayout />
            <section className="client_list_section spredsheet">
                <div className="container">
                    <div className="bg_white_box m-20">
                        <div className="special_flex mb-25">
                            <h1 className="main_title">Spreadsheet</h1>
                            <div className="right_flex">
                                <button className="common_btn ms-4">
                                    <img src="images/pre_white.svg" alt="" /> Back to list
                                </button>
                            </div>
                        </div>
                        <div className="sheet_accodian">
                            <div className="accordion" id="accordionExample">
                                <div className="accordion-item dragdrop_box">
                                    <h2 className="accordion-header" id="headingOne">
                                        <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne"
                                            aria-expanded="true" aria-controls="collapseOne">
                                            Drag and Drop file
                                        </button>
                                    </h2>
                                    <div id="collapseOne" className="accordion-collapse collapse show" aria-labelledby="headingOne"
                                        data-bs-parent="#accordionExample">
                                        <div className="accordion-body">
                                            <div className="upload-area" {...getRootProps()}>
                                                <input {...getInputProps()} />
                                                {
                                                    isDragActive ?
                                                        <h2>
                                                            Drop the files here...
                                                        </h2> :
                                                        <h2 className="text-center">
                                                            Drag and Drop file here
                                                            <div className="my-2 fw-bold">Or</div>
                                                            <span className="select-file">Click to select file</span>
                                                        </h2>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex_btn">
                            <button className="common_btn">Spreadsheet</button>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default UploadCsv;
