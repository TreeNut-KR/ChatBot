FROM python:3.12.1
ENV LANG en_US.UTF-8
ENV LC_ALL en_US.UTF-8
ENV TZ=Asia/Seoul

COPY ./sources /app
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


# 어플리케이션 실행
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]

