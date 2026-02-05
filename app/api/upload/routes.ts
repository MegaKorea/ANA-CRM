import { ConfigErrorCode, HttpStatusCode } from "@/constants/enums";
import { handleRouteError } from "@/lib/utils/route-handler";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const server = (formData.get("server") as string) || "server_1";

    if (!file) {
      handleRouteError(new Error("File không được để trống"), ConfigErrorCode.BAD_REQUEST);
    }

    const result = await uploadImage(file, server);

    return NextResponse.json(result, { status: HttpStatusCode.OK });
  } catch (error) {
    handleRouteError(error, ConfigErrorCode.INTERNAL_SERVER_ERROR);
  }
}

export async function uploadImage(  
    file: File,
    server: string = "server_1"
  ): Promise<UploadImageResponse> {
    const formData = new FormData();
    formData.append("images[]", file);
    formData.append("server", server);
  
    const response = await fetch("https://cfig.ibytecdn.org/upload", {
      method: "POST",
      body: formData,
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload thất bại: ${errorText}`);
    }
  
    const result: UploadImageApiResponse = await response.json();
  
    if (!result.success || !result.results || result.results.length === 0) {
      throw new Error("Upload thất bại: Không nhận được URL ảnh");
    }
  
    const imageUrl = result.results[0]?.url;
  
    if (!imageUrl) {
      throw new Error("Upload thất bại: Không có URL ảnh");
    }
  
    return { url: imageUrl };
  }


  export interface UploadImageResponse {
    url: string;
  }
  
  export interface UploadImageResult {
    success: boolean;
    filename: string;
    url: string;
    server: string;
  }
  
  export interface UploadImageApiResponse {
    success: boolean;
    results: UploadImageResult[];
  }