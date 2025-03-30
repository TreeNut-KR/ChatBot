import React, { useState } from 'react';
import axios from 'axios';

const CharacterApiTest: React.FC = () => {
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [endpoint, setEndpoint] = useState<string>('/server/character/publiuc');

  const testApi = async () => {
    try {
      setLoading(true);
      setError(null);
      setResponse(null);
      
      console.log(`API 요청: ${endpoint}`);
      const result = await axios.get(endpoint);
      
      console.log('API 응답:', result.data);
      setResponse(result.data);
    } catch (err: any) {
      console.error('API 에러:', err);
      setError(err.message || '알 수 없는 오류');
      
      if (err.response) {
        console.error('응답 데이터:', err.response.data);
        console.error('응답 상태:', err.response.status);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded mb-4">
      <h2 className="text-xl font-bold mb-2">API 테스트</h2>
      
      <div className="mb-4">
        <input
          type="text"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="API 엔드포인트"
        />
      </div>
      
      <button
        onClick={testApi}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
      >
        {loading ? '테스트 중...' : 'API 테스트'}
      </button>
      
      {error && (
        <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          에러: {error}
        </div>
      )}
      
      {response && (
        <div className="mt-4">
          <h3 className="font-bold">응답:</h3>
          <pre className="p-2 bg-gray-100 rounded overflow-auto max-h-60">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CharacterApiTest;
