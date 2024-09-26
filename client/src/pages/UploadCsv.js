import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';
import { useClient } from '../contexts/ClientContexts';

const UploadCsv = () => {
    const { clientObject, setClientObject, createSpreadsheet, getAllClients } = useClient()
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState("");

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            setFileName(acceptedFiles[0]?.name);
            setFile(acceptedFiles[0]);
        }
    }, []);

    const handleUpload = async () => {
        if (!file) return;
        setIsLoading(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (result) => {
                setIsLoading(false);
                const data = result.data;
                if (data.length > 0) {
                    const headers = Object.keys(data[0]);
                    const formattedData = data.map(row =>
                        headers.map(header => row[header] || '')
                    );

                    const spreadsheet = await createSpreadsheet(clientObject?.value, [headers, ...formattedData])
                    if (!spreadsheet?.error) {
                        setClientObject("")
                        setFile(null)
                        setFileName("")
                        navigate(`/user/spreadsheet/${clientObject?.value}`)
                    }

                }
            },
            error: (error) => {
                setIsLoading(false);
                console.error("Error parsing CSV file:", error);
            }
        });
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': [],
        },
        multiple: false
    });

    const fetchClient = async () => {
        const { clients } = await getAllClients(1, 1, "_id", -1, "")
        if (clients.length > 0) {
            setClientObject({
                label: clients[0].entity_name ? clients[0].entity_name : `${clients[0].first_name} ${clients[0].last_name}`,
                value: clients[0]._id,
            })
        }
    }

    useEffect(() => {
        fetchClient()

        return () => {
            setClientObject({});
        };
    }, [])

    return (
        <>
            <Layout showSelection={true}>
                {isLoading ? (
                    <Loader />
                ) : (
                    <>
                        <div className="special_flex mb-25">
                            <h1 className="main_title">Spreadsheet</h1>
                            <div className="right_flex">
                                <button className="common_btn ms-4" onClick={() => navigate("/user/clients")}>
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
                                                        <h2>Drop the files here...</h2> :
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
                        {fileName && (
                            <p>{fileName}</p>
                        )}
                        <div className="flex_btn">
                            <button className={`common_btn ${(!file || !clientObject?.value) && 'opacity-50'}`} onClick={handleUpload} disabled={!file || !clientObject?.value}>
                                Upload
                            </button>
                        </div>
                    </>
                )}
            </Layout>
        </>
    );
};

export default UploadCsv;
