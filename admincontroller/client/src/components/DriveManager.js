import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';

function DriveManager() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/drive/files');
      setFiles(response.data);
      setError(null);
    } catch (err) {
      setError('파일 목록을 불러오는데 실패했습니다.');
      console.error('파일 목록 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('파일을 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      await axios.post('/api/drive/upload', formData);
      setSuccessMessage('파일이 성공적으로 업로드되었습니다.');
      setSelectedFile(null);
      loadFiles();
    } catch (err) {
      setError('파일 업로드에 실패했습니다.');
      console.error('업로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('정말 이 파일을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`/api/drive/files/${fileId}`);
      setSuccessMessage('파일이 성공적으로 삭제되었습니다.');
      loadFiles();
    } catch (err) {
      setError('파일 삭제에 실패했습니다.');
      console.error('삭제 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        구글 드라이브 파일 관리
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <input
          type="file"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="file-input"
        />
        <label htmlFor="file-input">
          <Button
            variant="contained"
            component="span"
            startIcon={<FileUploadIcon />}
          >
            파일 선택
          </Button>
        </label>
        {selectedFile && (
          <Box sx={{ mt: 1 }}>
            <Typography>
              선택된 파일: {selectedFile.name}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={loading}
              sx={{ mt: 1 }}
            >
              업로드
            </Button>
          </Box>
        )}
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>파일명</TableCell>
                <TableCell>생성일</TableCell>
                <TableCell>미리보기</TableCell>
                <TableCell>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>{file.name}</TableCell>
                  <TableCell>
                    {new Date(file.createdTime).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      보기
                    </a>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(file.id)}
                    >
                      삭제
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default DriveManager;