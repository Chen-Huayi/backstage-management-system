import {
    Card,
    Breadcrumb,
    Form,
    Button,
    Radio,
    Input,
    Upload,
    Space,
    Select,
    message
} from 'antd'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { PlusOutlined } from '@ant-design/icons'
import {Link, useSearchParams, useNavigate} from 'react-router-dom'
import './index.scss'
import {useEffect, useRef, useState} from "react";
import {http} from "src/utils";
import {observer} from "mobx-react-lite";
import React from "react";
import {useStore} from "src/store";

const { Option } = Select

function Publish(){
    const {channelStore}=useStore()

    const [fileList, setFileList]=useState([])
    const cacheImageList=useRef([])
    const onUploadChange=({fileList})=>{
        const formatList=fileList.map(file=>{
            if (file.response){
                return {
                    url: file.response.data.url
                }
            }
            return file
        })
        setFileList(formatList)
        cacheImageList.current=formatList
    }

    const [imgCount, setImgCount]=useState(1)
    const radioChange=(e)=>{
        const count=e.target.value
        setImgCount(count)

        if (cacheImageList.current.length===0){
            return false
        }

        if (count===1){
            const img=cacheImageList.current ?  cacheImageList.current[0]:[]
            setFileList([img])
        }else if (count===3){
            setFileList(cacheImageList.current)
        }
    }

    const [params]=useSearchParams()
    const id =params.get('id')
    const navigate=useNavigate()

    const onFinish= async (value)=>{
        console.log(value)
        const {channel_id, content, title, type}=value
        const params={
            channel_id,
            content,
            title,
            type,
            cover: {
                type: type,
                images: fileList.map(item=>item.url)
            }
        }

        if (id){
            await http.put(`http://geek.itheima.net/v1_0/mp/articles/${id}?draft=false`, params)
        }else {
            await http.post('http://geek.itheima.net/v1_0/mp/articles?draft=false', params)
        }

        navigate('/article')
        message.success(`Successfully ${id ? 'Update' : 'Upload'}`)
    }


    const form=useRef(null)

    useEffect(()=>{
        const loadDetail=async ()=>{
            const res=await http.get(`http://geek.itheima.net/v1_0/mp/articles/${id}`)
            const data=res.data
            form.current.setFieldsValue({...data, type: data.cover.type})

            const formatImgList=data.cover.images.map(url=>({url}))
            setFileList(formatImgList)
            cacheImageList.current=formatImgList
        }
        if (id){
            loadDetail()
        }
    }, [id])


    return (
        <div className="publish">
            <Card
                title={
                    <Breadcrumb separator=">">
                        <Breadcrumb.Item>
                            <Link to="/home">Home</Link>
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>{id ? 'Edit' : 'Publish'} Article</Breadcrumb.Item>
                    </Breadcrumb>
                }
            >
                <Form
                    labelCol={{ span: 4 }}
                    wrapperCol={{ span: 16 }}
                    initialValues={{ type: 1, content: 'This is content' }}
                    onFinish={onFinish}
                    ref={form}
                >
                    <Form.Item
                        label="Title"
                        name="title"
                        rules={[{ required: true, message: 'Enter title' }]}
                    >
                        <Input placeholder="Please enter title" style={{ width: 400 }} />
                    </Form.Item>
                    <Form.Item
                        label="Channel"
                        name="channel_id"
                        rules={[{ required: true, message: 'Choose channel' }]}
                    >
                        <Select placeholder="Please choose channel" style={{ width: 400 }}>
                            {(typeof channelStore.channelList==='undefined')?(<p>Loading...</p>):(
                                channelStore.channelList.map(
                                    (channel, i)=>(<Option key={i} value={i}>{channel}</Option>)
                                )
                            )}
                        </Select>
                    </Form.Item>

                    <Form.Item label="Cover">
                        <Form.Item name="type">
                            <Radio.Group onChange={radioChange}>
                                <Radio value={1}>Single picture</Radio>
                                <Radio value={3}>Triple pictures</Radio>
                                <Radio value={0}>No picture</Radio>
                            </Radio.Group>
                        </Form.Item>

                        {imgCount>0 && (
                            <Upload
                                name="image"
                                listType="picture-card"
                                className="avatar-uploader"
                                showUploadList
                                action="http://geek.itheima.net/v1_0/upload"
                                fileList={fileList}
                                onChange={onUploadChange}
                                multiple={imgCount>1}
                                maxCount={imgCount}
                            >
                                <div style={{ marginTop: 8 }}>
                                    <PlusOutlined />
                                </div>
                            </Upload>
                        )}

                    </Form.Item>
                    <Form.Item
                        label="Content"
                        name="content"
                        rules={[{ required: true, message: 'Please enter content' }]}
                    >
                        <ReactQuill
                            className="publish-quill"
                            theme="snow"
                            placeholder="Please enter content"
                        />
                    </Form.Item>

                    <Form.Item wrapperCol={{ offset: 4 }}>
                        <Space>
                            <Button size="large" type="primary" htmlType="submit">
                                {id ? 'Update' : 'Upload'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    )
}

export default observer(Publish)
