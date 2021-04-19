模型训练 tfgpu  Basic
模型转换： tfjs tensorflowjs_converter --input_format=tf_saved_model .\saved_model\  web_model
模型加载： import { loadGraphModel } from '@tensorflow/tfjs-converter';
模型数据预测

tensorflow >=2  la=oadGraphModel
keras model = loadLayersModel 