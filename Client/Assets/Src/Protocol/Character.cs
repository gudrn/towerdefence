// <auto-generated>
//     Generated by the protocol buffer compiler.  DO NOT EDIT!
//     source: character.proto
// </auto-generated>
#pragma warning disable 1591, 0612, 3021, 8981
#region Designer generated code

using pb = global::Google.Protobuf;
using pbc = global::Google.Protobuf.Collections;
using pbr = global::Google.Protobuf.Reflection;
using scg = global::System.Collections.Generic;
namespace Protocol {

  /// <summary>Holder for reflection information generated from character.proto</summary>
  public static partial class CharacterReflection {

    #region Descriptor
    /// <summary>File descriptor for character.proto</summary>
    public static pbr::FileDescriptor Descriptor {
      get { return descriptor; }
    }
    private static pbr::FileDescriptor descriptor;

    static CharacterReflection() {
      byte[] descriptorData = global::System.Convert.FromBase64String(
          string.Concat(
            "Cg9jaGFyYWN0ZXIucHJvdG8SCFByb3RvY29sGgxzdHJ1Y3QucHJvdG8aCmVu",
            "dW0ucHJvdG8iVQofQzJCX1BsYXllclBvc2l0aW9uVXBkYXRlUmVxdWVzdBIi",
            "Cgdwb3NJbmZvGAEgASgLMhEuUHJvdG9jb2wuUG9zSW5mbxIOCgZyb29tSWQY",
            "AiABKAUiSgokQjJDX1BsYXllclBvc2l0aW9uVXBkYXRlTm90aWZpY2F0aW9u",
            "EiIKB3Bvc0luZm8YASABKAsyES5Qcm90b2NvbC5Qb3NJbmZvIjQKEkMyQl9V",
            "c2VDYXJkUmVxdWVzdBIOCgZyb29tSWQYASABKAUSDgoGY2FyZElkGAIgASgJ",
            "YgZwcm90bzM="));
      descriptor = pbr::FileDescriptor.FromGeneratedCode(descriptorData,
          new pbr::FileDescriptor[] { global::Protocol.StructReflection.Descriptor, global::Protocol.EnumReflection.Descriptor, },
          new pbr::GeneratedClrTypeInfo(null, null, new pbr::GeneratedClrTypeInfo[] {
            new pbr::GeneratedClrTypeInfo(typeof(global::Protocol.C2B_PlayerPositionUpdateRequest), global::Protocol.C2B_PlayerPositionUpdateRequest.Parser, new[]{ "PosInfo", "RoomId" }, null, null, null, null),
            new pbr::GeneratedClrTypeInfo(typeof(global::Protocol.B2C_PlayerPositionUpdateNotification), global::Protocol.B2C_PlayerPositionUpdateNotification.Parser, new[]{ "PosInfo" }, null, null, null, null),
            new pbr::GeneratedClrTypeInfo(typeof(global::Protocol.C2B_UseCardRequest), global::Protocol.C2B_UseCardRequest.Parser, new[]{ "RoomId", "CardId" }, null, null, null, null)
          }));
    }
    #endregion

  }
  #region Messages
  /// <summary>
  /// 캐릭터 위치 동기화
  /// </summary>
  public sealed partial class C2B_PlayerPositionUpdateRequest : pb::IMessage<C2B_PlayerPositionUpdateRequest>
  #if !GOOGLE_PROTOBUF_REFSTRUCT_COMPATIBILITY_MODE
      , pb::IBufferMessage
  #endif
  {
    private static readonly pb::MessageParser<C2B_PlayerPositionUpdateRequest> _parser = new pb::MessageParser<C2B_PlayerPositionUpdateRequest>(() => new C2B_PlayerPositionUpdateRequest());
    private pb::UnknownFieldSet _unknownFields;
    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public static pb::MessageParser<C2B_PlayerPositionUpdateRequest> Parser { get { return _parser; } }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public static pbr::MessageDescriptor Descriptor {
      get { return global::Protocol.CharacterReflection.Descriptor.MessageTypes[0]; }
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    pbr::MessageDescriptor pb::IMessage.Descriptor {
      get { return Descriptor; }
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public C2B_PlayerPositionUpdateRequest() {
      OnConstruction();
    }

    partial void OnConstruction();

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public C2B_PlayerPositionUpdateRequest(C2B_PlayerPositionUpdateRequest other) : this() {
      posInfo_ = other.posInfo_ != null ? other.posInfo_.Clone() : null;
      roomId_ = other.roomId_;
      _unknownFields = pb::UnknownFieldSet.Clone(other._unknownFields);
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public C2B_PlayerPositionUpdateRequest Clone() {
      return new C2B_PlayerPositionUpdateRequest(this);
    }

    /// <summary>Field number for the "posInfo" field.</summary>
    public const int PosInfoFieldNumber = 1;
    private global::Protocol.PosInfo posInfo_;
    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public global::Protocol.PosInfo PosInfo {
      get { return posInfo_; }
      set {
        posInfo_ = value;
      }
    }

    /// <summary>Field number for the "roomId" field.</summary>
    public const int RoomIdFieldNumber = 2;
    private int roomId_;
    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public int RoomId {
      get { return roomId_; }
      set {
        roomId_ = value;
      }
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public override bool Equals(object other) {
      return Equals(other as C2B_PlayerPositionUpdateRequest);
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public bool Equals(C2B_PlayerPositionUpdateRequest other) {
      if (ReferenceEquals(other, null)) {
        return false;
      }
      if (ReferenceEquals(other, this)) {
        return true;
      }
      if (!object.Equals(PosInfo, other.PosInfo)) return false;
      if (RoomId != other.RoomId) return false;
      return Equals(_unknownFields, other._unknownFields);
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public override int GetHashCode() {
      int hash = 1;
      if (posInfo_ != null) hash ^= PosInfo.GetHashCode();
      if (RoomId != 0) hash ^= RoomId.GetHashCode();
      if (_unknownFields != null) {
        hash ^= _unknownFields.GetHashCode();
      }
      return hash;
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public override string ToString() {
      return pb::JsonFormatter.ToDiagnosticString(this);
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public void WriteTo(pb::CodedOutputStream output) {
    #if !GOOGLE_PROTOBUF_REFSTRUCT_COMPATIBILITY_MODE
      output.WriteRawMessage(this);
    #else
      if (posInfo_ != null) {
        output.WriteRawTag(10);
        output.WriteMessage(PosInfo);
      }
      if (RoomId != 0) {
        output.WriteRawTag(16);
        output.WriteInt32(RoomId);
      }
      if (_unknownFields != null) {
        _unknownFields.WriteTo(output);
      }
    #endif
    }

    #if !GOOGLE_PROTOBUF_REFSTRUCT_COMPATIBILITY_MODE
    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    void pb::IBufferMessage.InternalWriteTo(ref pb::WriteContext output) {
      if (posInfo_ != null) {
        output.WriteRawTag(10);
        output.WriteMessage(PosInfo);
      }
      if (RoomId != 0) {
        output.WriteRawTag(16);
        output.WriteInt32(RoomId);
      }
      if (_unknownFields != null) {
        _unknownFields.WriteTo(ref output);
      }
    }
    #endif

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public int CalculateSize() {
      int size = 0;
      if (posInfo_ != null) {
        size += 1 + pb::CodedOutputStream.ComputeMessageSize(PosInfo);
      }
      if (RoomId != 0) {
        size += 1 + pb::CodedOutputStream.ComputeInt32Size(RoomId);
      }
      if (_unknownFields != null) {
        size += _unknownFields.CalculateSize();
      }
      return size;
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public void MergeFrom(C2B_PlayerPositionUpdateRequest other) {
      if (other == null) {
        return;
      }
      if (other.posInfo_ != null) {
        if (posInfo_ == null) {
          PosInfo = new global::Protocol.PosInfo();
        }
        PosInfo.MergeFrom(other.PosInfo);
      }
      if (other.RoomId != 0) {
        RoomId = other.RoomId;
      }
      _unknownFields = pb::UnknownFieldSet.MergeFrom(_unknownFields, other._unknownFields);
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public void MergeFrom(pb::CodedInputStream input) {
    #if !GOOGLE_PROTOBUF_REFSTRUCT_COMPATIBILITY_MODE
      input.ReadRawMessage(this);
    #else
      uint tag;
      while ((tag = input.ReadTag()) != 0) {
        switch(tag) {
          default:
            _unknownFields = pb::UnknownFieldSet.MergeFieldFrom(_unknownFields, input);
            break;
          case 10: {
            if (posInfo_ == null) {
              PosInfo = new global::Protocol.PosInfo();
            }
            input.ReadMessage(PosInfo);
            break;
          }
          case 16: {
            RoomId = input.ReadInt32();
            break;
          }
        }
      }
    #endif
    }

    #if !GOOGLE_PROTOBUF_REFSTRUCT_COMPATIBILITY_MODE
    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    void pb::IBufferMessage.InternalMergeFrom(ref pb::ParseContext input) {
      uint tag;
      while ((tag = input.ReadTag()) != 0) {
        switch(tag) {
          default:
            _unknownFields = pb::UnknownFieldSet.MergeFieldFrom(_unknownFields, ref input);
            break;
          case 10: {
            if (posInfo_ == null) {
              PosInfo = new global::Protocol.PosInfo();
            }
            input.ReadMessage(PosInfo);
            break;
          }
          case 16: {
            RoomId = input.ReadInt32();
            break;
          }
        }
      }
    }
    #endif

  }

  /// <summary>
  /// 캐릭터 위치 동기화 알림
  /// </summary>
  public sealed partial class B2C_PlayerPositionUpdateNotification : pb::IMessage<B2C_PlayerPositionUpdateNotification>
  #if !GOOGLE_PROTOBUF_REFSTRUCT_COMPATIBILITY_MODE
      , pb::IBufferMessage
  #endif
  {
    private static readonly pb::MessageParser<B2C_PlayerPositionUpdateNotification> _parser = new pb::MessageParser<B2C_PlayerPositionUpdateNotification>(() => new B2C_PlayerPositionUpdateNotification());
    private pb::UnknownFieldSet _unknownFields;
    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public static pb::MessageParser<B2C_PlayerPositionUpdateNotification> Parser { get { return _parser; } }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public static pbr::MessageDescriptor Descriptor {
      get { return global::Protocol.CharacterReflection.Descriptor.MessageTypes[1]; }
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    pbr::MessageDescriptor pb::IMessage.Descriptor {
      get { return Descriptor; }
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public B2C_PlayerPositionUpdateNotification() {
      OnConstruction();
    }

    partial void OnConstruction();

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public B2C_PlayerPositionUpdateNotification(B2C_PlayerPositionUpdateNotification other) : this() {
      posInfo_ = other.posInfo_ != null ? other.posInfo_.Clone() : null;
      _unknownFields = pb::UnknownFieldSet.Clone(other._unknownFields);
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public B2C_PlayerPositionUpdateNotification Clone() {
      return new B2C_PlayerPositionUpdateNotification(this);
    }

    /// <summary>Field number for the "posInfo" field.</summary>
    public const int PosInfoFieldNumber = 1;
    private global::Protocol.PosInfo posInfo_;
    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public global::Protocol.PosInfo PosInfo {
      get { return posInfo_; }
      set {
        posInfo_ = value;
      }
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public override bool Equals(object other) {
      return Equals(other as B2C_PlayerPositionUpdateNotification);
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public bool Equals(B2C_PlayerPositionUpdateNotification other) {
      if (ReferenceEquals(other, null)) {
        return false;
      }
      if (ReferenceEquals(other, this)) {
        return true;
      }
      if (!object.Equals(PosInfo, other.PosInfo)) return false;
      return Equals(_unknownFields, other._unknownFields);
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public override int GetHashCode() {
      int hash = 1;
      if (posInfo_ != null) hash ^= PosInfo.GetHashCode();
      if (_unknownFields != null) {
        hash ^= _unknownFields.GetHashCode();
      }
      return hash;
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public override string ToString() {
      return pb::JsonFormatter.ToDiagnosticString(this);
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public void WriteTo(pb::CodedOutputStream output) {
    #if !GOOGLE_PROTOBUF_REFSTRUCT_COMPATIBILITY_MODE
      output.WriteRawMessage(this);
    #else
      if (posInfo_ != null) {
        output.WriteRawTag(10);
        output.WriteMessage(PosInfo);
      }
      if (_unknownFields != null) {
        _unknownFields.WriteTo(output);
      }
    #endif
    }

    #if !GOOGLE_PROTOBUF_REFSTRUCT_COMPATIBILITY_MODE
    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    void pb::IBufferMessage.InternalWriteTo(ref pb::WriteContext output) {
      if (posInfo_ != null) {
        output.WriteRawTag(10);
        output.WriteMessage(PosInfo);
      }
      if (_unknownFields != null) {
        _unknownFields.WriteTo(ref output);
      }
    }
    #endif

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public int CalculateSize() {
      int size = 0;
      if (posInfo_ != null) {
        size += 1 + pb::CodedOutputStream.ComputeMessageSize(PosInfo);
      }
      if (_unknownFields != null) {
        size += _unknownFields.CalculateSize();
      }
      return size;
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public void MergeFrom(B2C_PlayerPositionUpdateNotification other) {
      if (other == null) {
        return;
      }
      if (other.posInfo_ != null) {
        if (posInfo_ == null) {
          PosInfo = new global::Protocol.PosInfo();
        }
        PosInfo.MergeFrom(other.PosInfo);
      }
      _unknownFields = pb::UnknownFieldSet.MergeFrom(_unknownFields, other._unknownFields);
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public void MergeFrom(pb::CodedInputStream input) {
    #if !GOOGLE_PROTOBUF_REFSTRUCT_COMPATIBILITY_MODE
      input.ReadRawMessage(this);
    #else
      uint tag;
      while ((tag = input.ReadTag()) != 0) {
        switch(tag) {
          default:
            _unknownFields = pb::UnknownFieldSet.MergeFieldFrom(_unknownFields, input);
            break;
          case 10: {
            if (posInfo_ == null) {
              PosInfo = new global::Protocol.PosInfo();
            }
            input.ReadMessage(PosInfo);
            break;
          }
        }
      }
    #endif
    }

    #if !GOOGLE_PROTOBUF_REFSTRUCT_COMPATIBILITY_MODE
    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    void pb::IBufferMessage.InternalMergeFrom(ref pb::ParseContext input) {
      uint tag;
      while ((tag = input.ReadTag()) != 0) {
        switch(tag) {
          default:
            _unknownFields = pb::UnknownFieldSet.MergeFieldFrom(_unknownFields, ref input);
            break;
          case 10: {
            if (posInfo_ == null) {
              PosInfo = new global::Protocol.PosInfo();
            }
            input.ReadMessage(PosInfo);
            break;
          }
        }
      }
    }
    #endif

  }

  /// <summary>
  /// 카드 사용
  /// </summary>
  public sealed partial class C2B_UseCardRequest : pb::IMessage<C2B_UseCardRequest>
  #if !GOOGLE_PROTOBUF_REFSTRUCT_COMPATIBILITY_MODE
      , pb::IBufferMessage
  #endif
  {
    private static readonly pb::MessageParser<C2B_UseCardRequest> _parser = new pb::MessageParser<C2B_UseCardRequest>(() => new C2B_UseCardRequest());
    private pb::UnknownFieldSet _unknownFields;
    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public static pb::MessageParser<C2B_UseCardRequest> Parser { get { return _parser; } }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public static pbr::MessageDescriptor Descriptor {
      get { return global::Protocol.CharacterReflection.Descriptor.MessageTypes[2]; }
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    pbr::MessageDescriptor pb::IMessage.Descriptor {
      get { return Descriptor; }
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public C2B_UseCardRequest() {
      OnConstruction();
    }

    partial void OnConstruction();

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public C2B_UseCardRequest(C2B_UseCardRequest other) : this() {
      roomId_ = other.roomId_;
      cardId_ = other.cardId_;
      _unknownFields = pb::UnknownFieldSet.Clone(other._unknownFields);
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public C2B_UseCardRequest Clone() {
      return new C2B_UseCardRequest(this);
    }

    /// <summary>Field number for the "roomId" field.</summary>
    public const int RoomIdFieldNumber = 1;
    private int roomId_;
    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public int RoomId {
      get { return roomId_; }
      set {
        roomId_ = value;
      }
    }

    /// <summary>Field number for the "cardId" field.</summary>
    public const int CardIdFieldNumber = 2;
    private string cardId_ = "";
    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public string CardId {
      get { return cardId_; }
      set {
        cardId_ = pb::ProtoPreconditions.CheckNotNull(value, "value");
      }
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public override bool Equals(object other) {
      return Equals(other as C2B_UseCardRequest);
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public bool Equals(C2B_UseCardRequest other) {
      if (ReferenceEquals(other, null)) {
        return false;
      }
      if (ReferenceEquals(other, this)) {
        return true;
      }
      if (RoomId != other.RoomId) return false;
      if (CardId != other.CardId) return false;
      return Equals(_unknownFields, other._unknownFields);
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public override int GetHashCode() {
      int hash = 1;
      if (RoomId != 0) hash ^= RoomId.GetHashCode();
      if (CardId.Length != 0) hash ^= CardId.GetHashCode();
      if (_unknownFields != null) {
        hash ^= _unknownFields.GetHashCode();
      }
      return hash;
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public override string ToString() {
      return pb::JsonFormatter.ToDiagnosticString(this);
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public void WriteTo(pb::CodedOutputStream output) {
    #if !GOOGLE_PROTOBUF_REFSTRUCT_COMPATIBILITY_MODE
      output.WriteRawMessage(this);
    #else
      if (RoomId != 0) {
        output.WriteRawTag(8);
        output.WriteInt32(RoomId);
      }
      if (CardId.Length != 0) {
        output.WriteRawTag(18);
        output.WriteString(CardId);
      }
      if (_unknownFields != null) {
        _unknownFields.WriteTo(output);
      }
    #endif
    }

    #if !GOOGLE_PROTOBUF_REFSTRUCT_COMPATIBILITY_MODE
    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    void pb::IBufferMessage.InternalWriteTo(ref pb::WriteContext output) {
      if (RoomId != 0) {
        output.WriteRawTag(8);
        output.WriteInt32(RoomId);
      }
      if (CardId.Length != 0) {
        output.WriteRawTag(18);
        output.WriteString(CardId);
      }
      if (_unknownFields != null) {
        _unknownFields.WriteTo(ref output);
      }
    }
    #endif

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public int CalculateSize() {
      int size = 0;
      if (RoomId != 0) {
        size += 1 + pb::CodedOutputStream.ComputeInt32Size(RoomId);
      }
      if (CardId.Length != 0) {
        size += 1 + pb::CodedOutputStream.ComputeStringSize(CardId);
      }
      if (_unknownFields != null) {
        size += _unknownFields.CalculateSize();
      }
      return size;
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public void MergeFrom(C2B_UseCardRequest other) {
      if (other == null) {
        return;
      }
      if (other.RoomId != 0) {
        RoomId = other.RoomId;
      }
      if (other.CardId.Length != 0) {
        CardId = other.CardId;
      }
      _unknownFields = pb::UnknownFieldSet.MergeFrom(_unknownFields, other._unknownFields);
    }

    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    public void MergeFrom(pb::CodedInputStream input) {
    #if !GOOGLE_PROTOBUF_REFSTRUCT_COMPATIBILITY_MODE
      input.ReadRawMessage(this);
    #else
      uint tag;
      while ((tag = input.ReadTag()) != 0) {
        switch(tag) {
          default:
            _unknownFields = pb::UnknownFieldSet.MergeFieldFrom(_unknownFields, input);
            break;
          case 8: {
            RoomId = input.ReadInt32();
            break;
          }
          case 18: {
            CardId = input.ReadString();
            break;
          }
        }
      }
    #endif
    }

    #if !GOOGLE_PROTOBUF_REFSTRUCT_COMPATIBILITY_MODE
    [global::System.Diagnostics.DebuggerNonUserCodeAttribute]
    [global::System.CodeDom.Compiler.GeneratedCode("protoc", null)]
    void pb::IBufferMessage.InternalMergeFrom(ref pb::ParseContext input) {
      uint tag;
      while ((tag = input.ReadTag()) != 0) {
        switch(tag) {
          default:
            _unknownFields = pb::UnknownFieldSet.MergeFieldFrom(_unknownFields, ref input);
            break;
          case 8: {
            RoomId = input.ReadInt32();
            break;
          }
          case 18: {
            CardId = input.ReadString();
            break;
          }
        }
      }
    }
    #endif

  }

  #endregion

}

#endregion Designer generated code
