import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../Header/Header';
import { getCookie } from '../../Cookies';

const CharacterAdd: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(() => {
    return localStorage.getItem('uploadedCharacterImage') || null;
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [characterData, setCharacterData] = useState({
    character_name: '',
    description: '',
    greeting: '',
    image: '',
    character_setting: '',
    access_level: true // true: 공개, false: 비공개
  });

  // 페이지가 로드될 때 미리보기 및 업로드 이미지 초기화
  useEffect(() => {
    localStorage.removeItem('characterPreviewImage');
    localStorage.removeItem('uploadedCharacterImage');
    setPreviewImage(null);
    setUploadedImageUrl(null);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'access_level') {
      setCharacterData({
        ...characterData,
        access_level: value === 'public' ? true : false
      });
    } else {
      setCharacterData({
        ...characterData,
        [name]: value
      });
      if (name === 'image') {
        setPreviewImage(null);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // 파일 크기 제한 (예: 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('파일 크기가 5MB를 초과할 수 없습니다.');
      return;
    }

    setSelectedFile(file);

    // 미리보기
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploading(true);
    setUploadError(null);

    try {
      const token = getCookie('jwt-token');
      if (!token) {
        setUploadError('로그인이 필요합니다.');
        setUploading(false);
        return;
      }

      const response = await axios.post(
        '/server/character/upload_png_image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.url) {
        setCharacterData({
          ...characterData,
          image: response.data.url
        });
        setPreviewImage(null);
        setUploadedImageUrl(response.data.url);
        localStorage.setItem('uploadedCharacterImage', response.data.url);
      } else {
        setUploadError('이미지 업로드에 실패했습니다.');
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.message || '이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = getCookie('jwt-token');
      if (!token) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      let imageUrl = characterData.image;

      // 파일이 선택되어 있으면, 생성 버튼 클릭 시 이미지 업로드
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadResponse = await axios.post(
          '/server/character/upload_png_image',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (uploadResponse.data && uploadResponse.data.url) {
          imageUrl = uploadResponse.data.url;
        } else {
          setError('이미지 업로드에 실패했습니다.');
          setLoading(false);
          return;
        }
      }

      const response = await axios.post('/server/character/add', {
        ...characterData,
        image: imageUrl
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      });

      if (response.status >= 200 && response.status < 300) {
        setSuccess('캐릭터가 성공적으로 추가되었습니다.');
        setCharacterData({
          character_name: '',
          description: '',
          greeting: '',
          image: '',
          character_setting: '',
          access_level: false
        });
        setSelectedFile(null);
        setPreviewImage(null);
        setUploadedImageUrl(null);
        setTimeout(() => {
          navigate('/CharacterChat');
        }, 2000);
      } else {
        setError('캐릭터 추가에 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormClick = () => {};

  const storedPreview = localStorage.getItem('characterPreviewImage');

  return (
    <div className="flex flex-col items-center w-full h-full bg-[#1a1918]">
      <Header />
      <div className="flex w-full max-w-[1280px] justify-center p-4">
        <div className="w-full max-w-3xl">
          <h1 className="text-3xl font-bold text-white mb-6">캐릭터 추가</h1>
          
          {error && (
            <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-500 text-white p-4 rounded-lg mb-6">
              {success}
            </div>
          )}
          
          <form
            onSubmit={handleSubmit}
            onClick={handleFormClick}
            className="bg-[#2a2928] rounded-lg p-6"
          >
            <div className="mb-4">
              <label htmlFor="character_name" className="block text-white font-medium mb-2">
                캐릭터 이름
              </label>
              <input
                type="text"
                id="character_name"
                name="character_name"
                value={characterData.character_name}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg bg-[#3f3f3f] text-white border-none focus:outline-none focus:ring-2 focus:ring-[#3b7cc9]"
                placeholder="캐릭터 이름을 입력하세요"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block text-white font-medium mb-2">
                캐릭터 설명
              </label>
              <textarea
                id="description"
                name="description"
                value={characterData.description}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg bg-[#3f3f3f] text-white border-none focus:outline-none focus:ring-2 focus:ring-[#3b7cc9] min-h-[100px]"
                placeholder="캐릭터에 대한 설명을 입력하세요"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="greeting" className="block text-white font-medium mb-2">
                시작 인사말
              </label>
              <textarea
                id="greeting"
                name="greeting"
                value={characterData.greeting}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg bg-[#3f3f3f] text-white border-none focus:outline-none focus:ring-2 focus:ring-[#3b7cc9] min-h-[100px]"
                placeholder="캐릭터의 첫 인사말을 입력하세요"
              />
            </div>

            <div className="mb-4">
              <label className="block text-white font-medium mb-2">
                캐릭터 이미지 업로드
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/png"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                  id="character-image-upload"
                  title="캐릭터 이미지 업로드"
                  aria-label="캐릭터 이미지 업로드"
                />
                <label
                  htmlFor="character-image-upload"
                  className="px-4 py-2 bg-[#3b7cc9] text-white rounded-lg cursor-pointer hover:bg-[#2d62a0]"
                >
                  파일 선택
                </label>
                {previewImage && (
                  <img
                    src={previewImage}
                    alt="캐릭터 미리보기"
                    className="w-16 h-16 object-cover rounded-lg border border-gray-400"
                  />
                )}
              </div>
              <p className="text-gray-400 text-xs mt-1">PNG 파일만 업로드 가능합니다.</p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="character_setting" className="block text-white font-medium mb-2">
                캐릭터 성격 및 설정
              </label>
              <textarea
                id="character_setting"
                name="character_setting"
                value={characterData.character_setting}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg bg-[#3f3f3f] text-white border-none focus:outline-none focus:ring-2 focus:ring-[#3b7cc9] min-h-[150px]"
                placeholder="캐릭터의 성격, 배경, 지식 등 상세한 설정을 입력하세요"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="access_level" className="block text-white font-medium mb-2">
                공개 상태
              </label>
              <select
                id="access_level"
                name="access_level"
                value={characterData.access_level ? 'public' : 'private'}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-[#3f3f3f] text-white border-none focus:outline-none focus:ring-2 focus:ring-[#3b7cc9]"
              >
                <option value="public">공개</option>
                <option value="private">비공개</option>
              </select>
              <p className="text-gray-400 text-sm mt-1">
                공개로 설정하면 다른 사용자에게 캐릭터가 노출됩니다.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/CharacterChat')}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 mr-3"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#3b7cc9] text-white rounded-lg hover:bg-[#2d62a0] disabled:bg-gray-500"
              >
                {loading ? '처리 중...' : '캐릭터 생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CharacterAdd;