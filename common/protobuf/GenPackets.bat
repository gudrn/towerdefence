@echo off
set PROTO_SRC_DIR=.
set PROTO_GEN_DIR=generated
set CLIENT_DIR=..\..\Client\Assets\Src\Protocol

REM generated 디렉터리가 없으면 생성
if not exist %PROTO_GEN_DIR% (
    mkdir %PROTO_GEN_DIR%
)

REM 모든 .proto 파일을 컴파일
for %%f in (*.proto) do (
    protoc -I=%PROTO_SRC_DIR% --csharp_out=%PROTO_GEN_DIR% "%%f"
    IF ERRORLEVEL 1 PAUSE
)

REM 생성된 파일을 client 폴더로 복사
xcopy /Y /E %PROTO_GEN_DIR%\* %CLIENT_DIR%\
IF ERRORLEVEL 1 PAUSE
