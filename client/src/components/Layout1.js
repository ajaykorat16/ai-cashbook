import React, { useRef, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useClient } from '../contexts/ClientContexts';
import { Toast } from 'primereact/toast';

const Layout1 = ({ children }) => {
    const params = useParams();
    const { toast } = useAuth()
    const { setShowInterBank, showInterBank, clientObject } = useClient()
    const location = useLocation();
    const sidebarRef = useRef(null);
    const contentRef = useRef(null);


    return (
        <>
            <Toast ref={toast} />
            <div className='main_layout'>
                <section className="client_list_section spreadsheet">
                    <div>
                        <div className="bg_white_box mt-20 p-0">
                            <div className="main_part_box wrapper">
                                <div id="sidebar" ref={sidebarRef}>
                                    <div className="side_data">
                                        <ul>
                                            <Link to={"/"} className='header_logo px-2 d-flex justify-content-center mb-3'>
                                                <img src="/images/accoutn_logo_3.png" alt="" />
                                            </Link>
                                            <>
                                                <li>
                                                    <Link
                                                        id="spreadsheetLink"
                                                        to={`/${params?.id}`}
                                                        className={location.pathname.match(`/${params?.id}`) && `selected`}
                                                    >
                                                        <Icon icon="file-icons:microsoft-excel" className='btn_icon' />Spreadsheet
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        id="autoCategorizeLink"
                                                        to={`/auto-categorize/${params?.id}`}
                                                        className={location.pathname.match(`/auto-categorize/${params?.id}`) && `selected`}
                                                        onClick={(e) => {
                                                            if (!clientObject.value) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        disabled={!clientObject.value}
                                                    >
                                                        <Icon icon="uil:chart-growth" className='btn_icon' />Auto Categorize
                                                    </Link>
                                                </li>
                                                <li><Link
                                                    onClick={() => {
                                                        setShowInterBank(!showInterBank);
                                                    }}
                                                >
                                                    <Icon icon="mdi:bank" className='btn_icon' />Inter Bank Transfer
                                                </Link></li>
                                            </>
                                        </ul>
                                    </div>
                                </div>
                                <div id="content" ref={contentRef}>
                                    {children}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    )
}

export default Layout1;
