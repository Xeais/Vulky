#version 450
#extension GL_ARB_separate_shader_objects : enable

const float PI = 3.14159265359;
const int LIGHT_NUM = 8;

layout(binding = 1) uniform LightUniformBufferObject
{
  vec4 LightPosition[LIGHT_NUM];
  vec4 LightColor[LIGHT_NUM];
  vec3 ViewPosition;
} Lighting;

layout(binding = 2) uniform MaterialUniformBufferObject
{
  vec4 Albedo;
  float Metallic;
  float Roughness;
  float Ao;
} Material;

layout(binding = 3) uniform sampler2D AlbedoSampler;
layout(binding = 4) uniform sampler2D NormalSampler;
layout(binding = 5) uniform sampler2D MetallicSampler;
layout(binding = 6) uniform sampler2D RoughnessSampler;
layout(binding = 7) uniform sampler2D AoSampler;

layout(location = 0) in vec4 FragPositionH;
layout(location = 1) in vec3 FragColor;
layout(location = 2) in vec2 FragTexCoord;
layout(location = 3) in vec3 FragPositionW;
layout(location = 4) in vec3 FragNormalW;
layout(location = 5) in vec3 FragTangentW;

layout(location = 0) out vec4 OutColor;

float DistributionGGX(vec3 N, vec3 H, float Roughness)
{
  float Alpha = Roughness * Roughness;
  float Alpha2 = Alpha * Alpha;
  float NDotH = max(dot(N, H), 0.0f);
  float NDotH2 = NDotH * NDotH;
  
  float Numerator = Alpha2;
  float Denominator = NDotH2 * (Alpha2 - 1.0f) + 1.0f;
  Denominator = PI * Denominator * Denominator;
  
  //Prevent divide by zero if roughness is zero and "NdotH" is 1.0.
  return Numerator / max(Denominator, 0.0001f); 
}

float GeometrySchlickGGX(float NDotV, float Roughness)
{
  float R = Roughness + 1.0f;
  float K = R * R * 0.125f;

  float Numerator = NDotV;
  float Denominator = NDotV * (1.0f - K) + K;

  return Numerator / Denominator;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float Roughness)
{
  float NDotV = max(dot(N, V), 0.0f);
  float NDotL = max(dot(N, L), 0.0f);
  float GGX1 = GeometrySchlickGGX(NDotV, Roughness);
  float GGX2 = GeometrySchlickGGX(NDotL, Roughness);

  return GGX1 * GGX2;
}

vec3 FresnelSchlick(float NDotV, vec3 F0) {return F0 + (1.0f - F0) * pow(1.0f - NDotV, 5.0f);}

vec3 TangentSpaceToWorldSpace(vec3 NormalMapSample, vec3 NormalW, vec3 TangentW)
{
  vec3 NormalRemapped = NormalMapSample * 2.0f - 1.0f;

  vec3 N = NormalW;
  vec3 T = normalize(TangentW - dot(TangentW, N) * N);
  vec3 B = cross(N, T);

  mat3 TBN = mat3(T, B, N);

  return TBN * NormalRemapped;
}

void main()
{
  //Albedo textures that come from artists are generally authored in sRGB space, thus we first convert them to linear space before using albedo in lighting calculations.
  vec3 Albedo = (Material.Albedo * pow(texture(AlbedoSampler, FragTexCoord), vec4(2.2f))).xyz;
  vec3 Normal = TangentSpaceToWorldSpace(texture(NormalSampler, FragTexCoord).xyz, FragNormalW, FragTangentW);
  float Metallic = Material.Metallic * texture(MetallicSampler, FragTexCoord).x;
  float Roughness = Material.Roughness * texture(RoughnessSampler, FragTexCoord).x;
  float Ao = Material.Ao * texture(AoSampler, FragTexCoord).x;

  vec3 N = normalize(Normal);
  vec3 V = normalize(Lighting.ViewPosition.xyz - FragPositionW);

  vec3 F0 = vec3(0.04f);
  F0 = mix(F0, Albedo, Metallic);

  vec3 Lo = vec3(0.0f);

  for(int i = 0; i < LIGHT_NUM; ++i)
  {
    vec3 L = normalize(Lighting.LightPosition[i].xyz - FragPositionW);
    vec3 H = normalize(V + L);

    float Distance = length(Lighting.LightPosition[i].xyz - FragPositionW);
    float Attenuation = 1.0f / (Distance * Distance);
    vec3 Radiance = Lighting.LightColor[i].xyz * Attenuation;

    float NDF = DistributionGGX(N, H, Roughness);
    float G = GeometrySmith(N, V, L, Roughness);
    vec3 F = FresnelSchlick(clamp(dot(H, V), 0.0f, 1.0f), F0);

    vec3 Numerator = NDF * G * F;
    float Denominator = 4.0f * max(dot(N, V), 0.0f) * max(dot(N, L), 0.0f);
    //Prevent divide by zero if "NdDtV" or "NDotL" is zero.
    vec3 Specular = Numerator / max(Denominator, 0.0001f);

    vec3 Ks = F;
    vec3 Kd = vec3(1.0f) - Ks;
    Kd *= (1.0f - Metallic);

    float NDotL = max(dot(N, L), 0.0f);
    Lo += (Kd * Albedo / PI + Specular) * Radiance * NDotL;
  }

  vec3 Ambient = vec3(0.03f) * Albedo * Ao;
  vec3 Color = Ambient + Lo;

  Color = Color / (Color + vec3(1.0f));
  Color = pow(Color, vec3(1.0f / 2.2f));

  OutColor = vec4(Color, 1.0f);
}